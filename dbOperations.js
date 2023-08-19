// dbOperations.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const vscode = require('vscode');
const { spawnSync } = require('child_process');

let DATABASE_PATH;

function setDatabasePath(extensionPath) {
    DATABASE_PATH = path.join(extensionPath, 'dev-diary.db');
}

function generateSimhashForContent(content, languageId) {
    const child = spawnSync('node', [path.join(__dirname, 'simhash.js'), 'generateSimhash', content, languageId]);
    if (child.error) {
        console.error("Error while generating simhash:", child.error);
    }    
    console.log("Trying to execute:", path.join(__dirname, 'simhash.js'));
    console.log("Arguments passed to simhash.js:", ['generateSimhash', content, languageId]);
    console.log("Stdout:", child.stdout.toString());
    console.log("Stderr:", child.stderr.toString());
    console.log("Exit code:", child.status);
    return child.stdout.toString().trim();
    
}

function compareHashSimilarity(hash1, hash2) {
    console.log("Started hash comparison");
    const child = spawnSync('node', [path.join(__dirname, 'simhash.js'), 'compareHashSimilarity', hash1, hash2], { env: process.env });
    if (child.error) {
        console.error("Error while comparing simhashes:", child.error);
    }      
    else {
        console.log("compareHashSimilarity child process started successfully.")
    }
    console.log("Executing:", path.join(__dirname, 'simhash.js'));
    console.log("Comparing the following hashes:", hash1, hash2);
    console.log("Finished hash comparison with result:", child.stdout.toString().trim());
    return child.stdout.toString().trim();
}

async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DATABASE_PATH, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(db);
            }
        });
    });
}

async function fetchExistingFunctions(db, relativeFilePath) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM raw_function WHERE location = ?`, relativeFilePath, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

async function insertFunctionsIntoDatabase(projectName, projectPath, fileNameOnly, document, functions) {
    const db = await initializeDatabase();

    try {
        await db.run('BEGIN TRANSACTION');

        const projectExists = await db.get(`SELECT COUNT(*) as count FROM project WHERE name = ? AND path = ?`, projectName, projectPath);

        if (projectExists.count === 0) {
            await db.run(`INSERT INTO project (name, path) VALUES (?, ?)`, projectName, projectPath);
        }

        await db.run(`INSERT OR IGNORE INTO project_file (name, path) VALUES (?, ?)`, fileNameOnly, document.fileName);

        await db.run(`INSERT OR IGNORE INTO project_has_file (project_id, file_id) 
            SELECT p.id, f.id 
            FROM project p, project_file f 
            WHERE p.name = ? AND f.path = ?`, projectName, document.fileName);

        const relativeFilePath = path.relative(vscode.workspace.workspaceFolders[0].uri.fsPath, document.fileName);
        console.log("Functions to process:", functions.length);

        for (const func of functions) {
            const simhash = generateSimhashForContent(func.content, document.languageId);

            console.log("Generated simhash:", simhash);

            const existingFunctions = await fetchExistingFunctions(db, relativeFilePath);
            console.log("Existing functions:", existingFunctions);
            
            let updated = false;
            if (existingFunctions && existingFunctions.length) { 
                console.log("Checking for existing functions...");
                for (const existingFunc of existingFunctions) {
                    console.log("Comparing with function:", existingFunc);
                    const comparisonResult = compareHashSimilarity(simhash, existingFunc.hash);
                    console.log("Comparison result for this function:", comparisonResult);
                    switch (comparisonResult) {
                        case "Completely Similar":
                            console.log(`Executing SQL: UPDATE raw_function SET content = ?, patchVersion = patchVersion + 1 WHERE id = ${existingFunc.id}`);
                            await db.run(`UPDATE raw_function SET content = ?, patchVersion = patchVersion + 1 WHERE id = ?`, func.content, existingFunc.id, (err) => {
                                if (err) {
                                   console.error("Error updating the function: ", err.message);
                                }
                             });
                            updated = true;
                            break;
        
                        case "Very Similar":
                            console.log(`Executing SQL: UPDATE raw_function SET content = ?, minorVersion = minorVersion + 1 WHERE id = ${existingFunc.id}`);
                            await db.run(`UPDATE raw_function SET content = ?, minorVersion = minorVersion + 1 WHERE id = ?`, func.content, existingFunc.id, (err) => {
                                if (err) {
                                   console.error("Error updating the function: ", err.message);
                                }
                             });
                            updated = true;
                            break;
        
                        case "Slightly Different":
                            console.log(`Executing SQL: UPDATE raw_function SET content = ?, majorVersion = majorVersion + 1 WHERE id = ${existingFunc.id}`);
                            await db.run(`UPDATE raw_function SET content = ?, majorVersion = majorVersion + 1 WHERE id = ?`, func.content, existingFunc.id, (err) => {
                                if (err) {
                                   console.error("Error updating the function: ", err.message);
                                }
                             });                             
                            updated = true;
                            break;
                    }
        
                    if (updated) {
                        break;
                    }
                }
            }
        
            if (!updated) {
                await db.run(`INSERT INTO raw_function (name, location, language, content, majorVersion, minorVersion, patchVersion, hash) 
                    VALUES (?, ?, ?, ?, 1, 0, 0, ?)`, func.name, relativeFilePath, document.languageId, func.content, simhash);
            }
        }        

        await db.run('COMMIT');

        return true;
    } catch (err) {
        await db.run('ROLLBACK');
        throw err;
    } finally {
        db.close();
    }
}

module.exports = {
    setDatabasePath,
    insertFunctionsIntoDatabase
};
