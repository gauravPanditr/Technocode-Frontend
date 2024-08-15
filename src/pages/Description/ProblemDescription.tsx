import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-c_cpp';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-twilight';
import 'ace-builds/src-noconflict/ext-language_tools';
import Languages from '../../constants/Languages';
import Themes from '../../constants/Themes';
import socket from '../../socket/socketapi';

const languageModeMap: Record<string, string> = {
    'java': 'java',
    'cpp': 'c_cpp',
    'python': 'python',
};

const themeMap: Record<string, string> = {
    'monokai': 'monokai',
    'github': 'github',
    'twilight': 'twilight',
};

function ProblemDescription() {
    const { problemId } = useParams();
    const [problem, setProblem] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [language, setLanguage] = useState('java');
    const [code, setCode] = useState<string>('');
    const [theme, setTheme] = useState('monokai');
    const [activeTab, setActiveTab] = useState<'statement' | 'editorial' | 'submissions'>('statement');
    const [consoleOutput, setConsoleOutput] = useState<string>('');
    const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/api/v1/problems/${problemId}`);
                if (response.status === 200 && response.data.success) {
                    setProblem(response.data.data);
                    const defaultCodeStub = response.data.data.codeStubs.find((stub: any) => stub.language.toLowerCase() === language) || { userSnippet: '' };
                    setCode(defaultCodeStub.userSnippet);
                } else {
                    throw new Error(response.data.message || 'Failed to fetch problem');
                }
            } catch (error: any) {
                setError(error.message || 'An unexpected error occurred');
            } finally {
                setLoading(false);
            }
        };

        if (problemId) {
            fetchProblem();
        }

        socket.on('connect', () => {
            console.log('Connected to WebSocket server');
            const userId = "1"; // Example userId
            console.log("Emitting setUserId");
            socket.emit('setUserId', userId);
        });

        socket.on('submissionPayloadResponse', (payload: any) => {
            console.log('Received payload:', payload);
            // Extract output and status from the payload
            const { output, status } = payload.response;
            setConsoleOutput(`Output: ${output}\nStatus: ${status}`);
            setSubmissionStatus(null); // Clear status after receiving response
        });

    }, [problemId, language]);
    const renderDescription = (description: string) => {
        // Splitting the description into sections and applying HTML formatting
        const formattedDescription = description
            // Format the Input section with a small gap
            .replace(/Input:\s*([^Output]+)/g, '<div><b>Input:</b><br/>$1</div>')
            // Format the Output section with a small gap
            .replace(/Output:\s*([^Explanation]+)/g, '<div><b>Output:</b><br/>$1</div>')
            // Format the Explanation section with a small gap
            .replace(/Explanation:\s*([\s\S]*?)(?=(Input|Output|Constraints|Examples|$))/g, '<div><b>Explanation:</b><br/>$1</div>')
            // Format the Constraints section with additional spacing
            .replace(/Constraints:\s*(.*)/, '<div style="margin-top: 20px;"><b>Constraints:</b><br/>$1<br/></div>')
            // Format the Expected Time Complexity section without extra line breaks
            .replace(/Expected Time Complexity:\s*(.*?)(?=\s*Expected Space Complexity|$)/, '<div><b>Expected Time Complexity:</b> $1</div>')
            // Format the Expected Space Complexity section
            .replace(/Expected Space Complexity:\s*(.*?)(?=\s*Note|$)/, '<div><b>Expected Space Complexity:</b> $1</div>')
            // Ensure a larger gap before and after examples
            .replace(/Examples?:\s*([\s\S]*?)(?=(Constraints|$))/g, '<div style="margin-top: 30px;"><b>Examples:</b><br/>$1</div>')
            // Format example sections with a larger gap before and after
            .replace(/Example (\d+):/g, '<div style="margin-top: 30px;"><b>Example $1:</b></div>')
            // Add a line break before and after numbers for list items
            .replace(/(\d+)\./g, '<br/><b>$1.</b>') // Numbering items in the explanation
            // Remove escaped new lines
            .replace(/\\n/g, '');
    
        return <div dangerouslySetInnerHTML={{ __html: formattedDescription }} />;
    };
    
    
    
    
    
    

    const handleSubmission = async () => {
        if (!problemId) {
            setError('Problem ID is missing.');
            return;
        }

        setSubmissionStatus('Running'); 
        // Set status to Running when submission starts
        setConsoleOutput('Running...');// Set status to Running when submission starts

        try {
            const response = await axios.post('http://localhost:5000/api/v1/submissions', {
                userId: "1",
                code,
                language,
                problemId
            });

            if (response.status === 201 && response.data.success) {
                // No action needed here; WebSocket response will handle the output
            } else {
                throw new Error(response.data.message || 'Submission failed.');
            }
        } catch (error: any) {
            setSubmissionStatus(null); // Clear status if error occurs
            setError(error.message || 'Failed to submit code.');
        }
    };

    const handleRunCode = async () => {
        try {
            socket.emit('runCode', {
                code,
                language,
                userId: "1"
            });
            setSubmissionStatus('Running'); // Set status to Running when running code
        } catch (error: any) {
            setError('Failed to run code.');
        }
    };

    if (loading) return <div className="text-center text-lg">Loading...</div>;
    if (error) return <div className="text-center text-lg text-red-500">Error: {error}</div>;

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLanguage = e.target.value;
        setLanguage(newLanguage);

        const selectedCodeStub = problem?.codeStubs.find((stub: any) => stub.language.toLowerCase() === newLanguage.toLowerCase()) || { userSnippet: '' };
        setCode(selectedCodeStub.userSnippet);
    };

    const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setTheme(e.target.value);
    };

    return (
        <div className='flex w-screen h-[calc(100vh-57px)]'>
            <div className='leftPanel h-full overflow-auto' style={{ width: '50%' }}>
                <div role="tablist" className="tabs tabs-boxed w-3/5">
                    <a onClick={() => setActiveTab('statement')} role="tab" className={activeTab === 'statement' ? 'tab tab-active' : 'tab'}>Problem Statement</a>
                    <a onClick={() => setActiveTab('editorial')} role="tab" className={activeTab === 'editorial' ? 'tab tab-active' : 'tab'}>Editorial</a>
                    <a onClick={() => setActiveTab('submissions')} role="tab" className={activeTab === 'submissions' ? 'tab tab-active' : 'tab'}>Submissions</a>
                </div>
                <div className='markdownViewer p-[20px]'>
                    {activeTab === 'statement' && (
                        <>
                            <h1>{problem?.title}</h1>
                            
                            <p>{problem?.description && renderDescription(problem?.description)}</p>
                        </>
                    )}
                    {activeTab === 'editorial' && <p>Editorial content here.</p>}
                    {activeTab === 'submissions' && <p>Submissions content here.</p>}
                </div>
            </div>
            <div className='divider cursor-col-resize w-[5px] bg-slate-200 h-full'></div>
            <div className='rightPanel h-full overflow-auto flex flex-col' style={{ width: '50%' }}>
                <div className='flex gap-x-1.5 justify-start items-center px-4 py-2'>
                    <button className="btn btn-success btn-sm" onClick={handleSubmission}>Submit</button>
                    <button className="btn btn-warning btn-sm" onClick={handleRunCode}>Run Code</button>
                    <select
                        className="select select-info w-full select-sm max-w-xs"
                        value={language}
                        onChange={handleLanguageChange}
                    >
                        {Languages.map((lang) => (
                            <option key={lang.value} value={lang.value}>{lang.languageName}</option>
                        ))}
                    </select>
                    <select
                        className="select select-info w-full select-sm max-w-xs"
                        value={theme}
                        onChange={handleThemeChange}
                    >
                        {Themes.map((theme) => (
                            <option key={theme.value} value={theme.value}>{theme.themeName}</option>
                        ))}
                    </select>
                </div>
                <div className='flex flex-col editor-console grow'>
                    <div className='editorContainer grow'>
                        <AceEditor
                            mode={languageModeMap[language] || 'text'}
                            theme={themeMap[theme] || 'textmate'}
                            value={code}
                            onChange={setCode}
                            name="editor"
                            editorProps={{ $blockScrolling: true }}
                            setOptions={{ showPrintMargin: false, fontSize: '16px' }} // Adjust fontSize here
                            style={{ height: 'calc(100% - 40px)', width: '100%' }} // Adjust height here
                        />
                    </div>
                    <div className='consoleOutput bg-gray-900 text-white p-4'>
                        <pre>{consoleOutput}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProblemDescription;
