import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ProblemData } from '../../types/problem.types'; // Define the ProblemData type

function ProblemList() {
    const [problems, setProblems] = useState<ProblemData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                // Fetch the data from the API
                const response = await axios.get("http://localhost:3000/api/v1/problems");
                console.log('API Response:', response); // Log the whole response
                const result = response.data;
                console.log('API Result:', result); // Log the result data

                // Check if the response is successful
                if (response.status === 200 && result.success) {
                    setProblems(result.data.map((problem: any) => ({
                        id: problem._id,  // Assuming _id is used as an identifier
                        title: problem.title,
                        difficulty: problem.difficulty
                    })));
                } else {
                    throw new Error(result.message || 'Failed to fetch problems');
                }
            } catch (error: any) {
                console.error('Fetch Error:', error); // Log the error
                setError(error.message || 'An unexpected error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchProblems();
    }, []);

    // Handle problem click
    const handleProblemClick = (problemId: string) => {
        navigate(`/problems/${problemId}`);
    };

    // Display loading, error, or list of problems
    if (loading) return <div className="text-center text-lg text-gray-600">Loading...</div>;
    if (error) return <div className="text-center text-lg text-red-500">Error: {error}</div>;

    return (
        <div className="flex flex-col items-center w-full p-4 bg-gray-900 min-h-screen">
            <div className="w-full max-w-4xl bg-gray-800 p-6 rounded-lg shadow-md flex flex-col">
                <h1 className="text-2xl font-bold text-white mb-4">Problems List</h1>
                <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 150px)' }}>
                    {problems.length > 0 ? (
                        problems.map((problem: ProblemData) => (
                            <div
                                key={problem.id}
                                className="bg-gray-700 p-4 rounded-lg mb-4 cursor-pointer hover:bg-gray-600 transition duration-200"
                                onClick={() => handleProblemClick(problem.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="text-lg font-medium text-white">{problem.title}</div>
                                    <div className="text-sm text-gray-400">{problem.difficulty}</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-lg text-gray-400">No problems available</div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProblemList;
