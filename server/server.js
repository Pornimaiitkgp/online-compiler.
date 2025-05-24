// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process'); // Import child_process for executing commands
const fs = require('fs'); // Import fs for file system operations
const path = require('path'); // Import path for resolving file paths

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Basic test route
app.get('/', (req, res) => {
    res.send('Online Judge Compiler Backend is running!');
});

// --- NEW CODE STARTS HERE ---

// Directory to store temporary code files
const TEMP_CODE_DIR = path.join(__dirname, 'temp');

// Ensure the temporary directory exists
if (!fs.existsSync(TEMP_CODE_DIR)) {
    fs.mkdirSync(TEMP_CODE_DIR);
}

// Helper function to generate unique filenames
const generateFileName = (language) => {
    const timestamp = Date.now();
    let extension = '';
    switch (language) {
        case 'cpp':
            extension = 'cpp';
            break;
        case 'java':
            extension = 'java';
            break;
        case 'python':
            extension = 'py';
            break;
        default:
            extension = 'txt'; // Fallback
    }
    return `code-${timestamp}.${extension}`;
};

// POST /compile endpoint
app.post('/compile', async (req, res) => {
    const { code, language, input } = req.body;

    if (!code || !language) {
        return res.status(400).json({ error: 'Code and language are required.' });
    }

    const fileName = generateFileName(language);
    const filePath = path.join(TEMP_CODE_DIR, fileName);
    const inputPath = path.join(TEMP_CODE_DIR, `input-${Date.now()}.txt`); // For custom input

    try {
        // Write the code to a temporary file
        fs.writeFileSync(filePath, code);

        // Write the input to a temporary file if provided
        if (input) {
            fs.writeFileSync(inputPath, input);
        }

        let command;
        let output = '';
        let error = '';

        // Determine the compilation/execution command based on language
        switch (language) {
            case 'cpp':
                // Compile C++ code, then execute with input redirected
                command = `g++ ${filePath} -o ${filePath}.out && ${filePath}.out < ${input ? inputPath : '/dev/null'}`;
                break;
            case 'java':
                // Java requires special handling for class names. For simplicity, we'll assume the main class name is "Main"
                // This means the user's Java code MUST have a `public class Main { ... }`
                const javaFileName = 'Main.java'; // Assuming Main.java for simplicity
                const javaFilePath = path.join(TEMP_CODE_DIR, javaFileName);
                fs.writeFileSync(javaFilePath, code); // Overwrite filePath with Java specific name
                command = `javac ${javaFilePath} -d ${TEMP_CODE_DIR} && java -cp ${TEMP_CODE_DIR} Main < ${input ? inputPath : '/dev/null'}`;
                // After compilation, `Main.class` will be in TEMP_CODE_DIR
                break;
            case 'python':
                // Execute Python code directly with input redirected
                command = `python ${filePath} < ${input ? inputPath : '/dev/null'}`;
                break;
            default:
                // If language is not supported
                return res.status(400).json({ error: 'Unsupported language.' });
        }

        console.log(`Executing command: ${command}`);

        // Execute the command using child_process.exec
        // THIS IS FOR DEMO PURPOSES ONLY. DO NOT USE IN PRODUCTION WITHOUT SANDBOXING!
        const { stdout, stderr } = await new Promise((resolve, reject) => {
            exec(command, { timeout: 5000 }, (err, stdout, stderr) => { // 5 second timeout
                if (err) {
                    // Command failed (compilation error, runtime error, timeout)
                    reject(err);
                }
                resolve({ stdout, stderr });
            });
        });

        output = stdout;
        error = stderr;

        res.json({ output: output + error }); // Combine stdout and stderr for simplicity for now

    } catch (err) {
        console.error('Execution error:', err);
        // Handle different types of errors
        if (err.killed && err.signal === 'SIGTERM') {
            output = 'Error: Time Limit Exceeded (5 seconds)';
        } else if (err.code === 127) { // Command not found (e.g., g++ not installed)
            output = `Error: Compiler/interpreter for ${language} not found on server.`;
        } else {
             // General execution error (e.g., compilation error, runtime error)
            output = `Error: ${err.message || 'An unknown error occurred during execution.'}`;
            if (err.stderr) output += `\nStderr: ${err.stderr}`; // Include stderr if available
        }
        res.status(500).json({ output });

    } finally {
        // Clean up temporary files
        try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            if (language === 'java') { // Clean up Main.java and Main.class for Java
                const javaFileName = 'Main.java';
                const javaFilePath = path.join(TEMP_CODE_DIR, javaFileName);
                if (fs.existsSync(javaFilePath)) fs.unlinkSync(javaFilePath);
                const javaClassPath = path.join(TEMP_CODE_DIR, 'Main.class');
                if (fs.existsSync(javaClassPath)) fs.unlinkSync(javaClassPath);
            } else if (language === 'cpp') { // Clean up executable for C++
                const cppExecutablePath = `${filePath}.out`;
                if (fs.existsSync(cppExecutablePath)) fs.unlinkSync(cppExecutablePath);
            }
            if (input && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        } catch (cleanupErr) {
            console.error('Error cleaning up temporary files:', cleanupErr);
        }
    }
});

// --- NEW CODE ENDS HERE ---

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access at: http://localhost:${PORT}`);
});