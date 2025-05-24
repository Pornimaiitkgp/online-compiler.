// client/src/App.js
import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import './App.css'; // We'll add some basic styling here

function App() {
    const [code, setCode] = useState(`// Type your C++ code here
#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}`);
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [language, setLanguage] = useState('cpp'); // Default language
    const [isLoading, setIsLoading] = useState(false);

    const languages = [
        { name: 'C++', value: 'cpp' },
        { name: 'Java', value: 'java' },
        { name: 'Python', value: 'python' },
        // Add more languages as needed
    ];

    const handleEditorChange = (value, event) => {
        setCode(value);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setOutput(''); // Clear previous output
        try {
            const response = await axios.post('/compile', {
                code,
                language,
                input,
            });
            setOutput(response.data.output); // Assuming backend sends { output: "..." }
        } catch (error) {
            console.error('Error during compilation:', error);
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                setOutput(`Error: ${error.response.data.error || error.response.statusText}`);
            } else if (error.request) {
                // The request was made but no response was received
                setOutput('Error: No response from server. Check if backend is running.');
            } else {
                // Something else happened in setting up the request that triggered an Error
                setOutput(`Error: ${error.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="App">
            <h1>Online Judge Compiler</h1>

            <div className="controls">
                <label htmlFor="language-select">Select Language:</label>
                <select
                    id="language-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                >
                    {languages.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                            {lang.name}
                        </option>
                    ))}
                </select>
                <button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? 'Running...' : 'Run Code'}
                </button>
            </div>

            <div className="editor-container">
                <Editor
                    height="60vh" // Adjust height as needed
                    language={language} // Monaco will try to apply syntax highlighting based on this
                    theme="vs-dark" // Or "light"
                    value={code}
                    onChange={handleEditorChange}
                    options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 16,
                    }}
                />
            </div>

            <div className="input-output-container">
                <div className="input-section">
                    <h2>Input</h2>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter custom input here (optional)"
                        rows="5"
                    ></textarea>
                </div>
                <div className="output-section">
                    <h2>Output</h2>
                    <pre>{output || (isLoading ? 'Executing code...' : 'No output yet.')}</pre>
                </div>
            </div>
        </div>
    );
}

export default App;