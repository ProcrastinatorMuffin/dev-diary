// initDB.js
const sqlite3 = require('sqlite3').verbose();

// Create a new database or connect to an existing one
let db = new sqlite3.Database('dev-diary.db');

db.serialize(() => {
    // Create tables
    db.run(`
        CREATE TABLE project (
            id INTEGER PRIMARY KEY,
            name TEXT,
            path TEXT
        )
    `);

    db.run(`
        CREATE TABLE project_file (
            id INTEGER PRIMARY KEY,
            name TEXT,
            path TEXT
        )
    `);

    db.run(`
        CREATE TABLE raw_function (
            id INTEGER PRIMARY KEY,
            name TEXT,
            location TEXT,
            language TEXT,
            content TEXT,
            majorVersion INTEGER,
            minorVersion INTEGER,
            patchVersion INTEGER
        )
    `);

    db.run(`
        CREATE TABLE concept (
            id INTEGER PRIMARY KEY,
            type TEXT,
            name TEXT,
            description TEXT,
            resources TEXT
        )
    `);

    db.run(`
        CREATE TABLE algorithm (
            id INTEGER PRIMARY KEY,
            type TEXT,
            name TEXT,
            description TEXT,
            resources TEXT
        )
    `);

    db.run(`
        CREATE TABLE data_structure (
            id INTEGER PRIMARY KEY,
            type TEXT,
            name TEXT,
            description TEXT,
            resources TEXT
        )
    `);

    // Create relationship tables
    db.run(`
        CREATE TABLE project_has_file (
            project_id INTEGER,
            file_id INTEGER,
            FOREIGN KEY(project_id) REFERENCES project(id),
            FOREIGN KEY(file_id) REFERENCES project_file(id)
        )
    `);

    db.run(`
        CREATE TABLE project_file_has_project (
            file_id INTEGER,
            project_id INTEGER,
            FOREIGN KEY(file_id) REFERENCES project_file(id),
            FOREIGN KEY(project_id) REFERENCES project(id)
        )
    `);

    db.run(`
        CREATE TABLE function_has_concept (
            function_id INTEGER,
            concept_id INTEGER,
            FOREIGN KEY(function_id) REFERENCES raw_function(id),
            FOREIGN KEY(concept_id) REFERENCES concept(id)
        )
    `);

    db.run(`
        CREATE TABLE concept_occurs_in_function (
            concept_id INTEGER,
            function_id INTEGER,
            FOREIGN KEY(concept_id) REFERENCES concept(id),
            FOREIGN KEY(function_id) REFERENCES raw_function(id)
        )
    `);

    db.run(`
        CREATE TABLE function_has_algorithm (
            function_id INTEGER,
            algorithm_id INTEGER,
            FOREIGN KEY(function_id) REFERENCES raw_function(id),
            FOREIGN KEY(algorithm_id) REFERENCES algorithm(id)
        )
    `);

    db.run(`
        CREATE TABLE algorithm_occurs_in_function (
            algorithm_id INTEGER,
            function_id INTEGER,
            FOREIGN KEY(algorithm_id) REFERENCES algorithm(id),
            FOREIGN KEY(function_id) REFERENCES raw_function(id)
        )
    `);

    db.run(`
        CREATE TABLE function_has_data_structure (
            function_id INTEGER,
            data_structure_id INTEGER,
            FOREIGN KEY(function_id) REFERENCES raw_function(id),
            FOREIGN KEY(data_structure_id) REFERENCES data_structure(id)
        )
    `);

    db.run(`
        CREATE TABLE data_structure_occurs_in_function (
            data_structure_id INTEGER,
            function_id INTEGER,
            FOREIGN KEY(data_structure_id) REFERENCES data_structure(id),
            FOREIGN KEY(function_id) REFERENCES raw_function(id)
        )
    `);
});

// Close the database connection
db.close();
