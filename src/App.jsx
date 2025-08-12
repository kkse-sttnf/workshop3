import { useEffect, useState } from "react";
import ListItem from "./listItem";
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { sepolia } from "viem/chains";

// Contract ABI
const abi = [];

// Contract Address 
const contractAddress = '';

function App() {

  const [task, setTask] = useState('');
  const [listItems, setListItems] = useState([]);
  const [connected, setConnected] = useState(false);
  const [accountAddress, setAccountAddress] = useState(null);
  const [loading, setLoading] = useState(false);

  // Create client Provider
  const client = createWalletClient({
    chain: sepolia,
    transport: custom(window.ethereum),
  });

  // Create public client Provider
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http('https://sepolia.drpc.org'),
  });

  // function to map task using id
  const getTask = async (id) => {
    try {
      setLoading(true);
      const [task, isComplete] = await publicClient.readContract({
        address: contractAddress,
        abi,
        args: [id],
        functionName: 'getTask',
      });

      return {
        task, isComplete
      }
    } catch (err) {
      console.error("Error get task:", err);
      alert("Failed to get Task.");
    } finally {
      setLoading(false);
    }
  }

  // function connect to wallet
  const handleConnect = async () => {
    setLoading(true);
    try {
      const [address] = await client.requestAddresses();
      setAccountAddress(address);
      setConnected(true);
    } catch (err) {
      console.error("Wallet connect failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // function to get all task
  const getAllTask = async () => {
    try {
      setLoading(true);
      const countTask = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'getTaskCount',
      });

      const tasks = [];
      for (let i = 0; i < countTask; i++) {
        const taskData = await getTask(i);
        tasks.push(taskData);
      }

      setListItems(tasks);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      alert("Failed to fetch tasks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getAllTask();
  }, []);

  // add task function
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!task.trim()) return alert("Task can't be empty");

    try {
      setLoading(true);

      const hash = await client.writeContract({
        address: contractAddress,
        abi,
        functionName: 'addTask',
        args: [task],
        account: accountAddress,
      });

      await publicClient.waitForTransactionReceipt({ hash });

      alert(`Task submitted! Tx Hash: ${hash}`);
      getAllTask();
      setTask('');
    } catch (err) {
      console.error("Error adding task:", err);
      alert("Failed to add task.");
    } finally {
      setLoading(false);
    }
  };

  // compliting task function
  const handleDone = async (id) => {
    try {
      setLoading(true);

      const hash = await client.writeContract({
        address: contractAddress,
        abi,
        functionName: 'completeTask',
        args: [id],
        account: accountAddress,
      });

      await publicClient.waitForTransactionReceipt({ hash });

      alert(`Task updated! Tx Hash: ${hash}`);
      getAllTask();
    } catch (err) {
      console.error("Error complete task:", err);
      alert("Failed to complete task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-indigo-600 py-12 flex justify-center">
      <main className="p-12">
        <h1 className="text-6xl font-medium">Todo List with Blockchain</h1>
        <div className="flex items-center justify-between">
          <button
            disabled={connected || loading}
            onClick={handleConnect}
            className="cursor-pointer disabled:cursor-default hover:-translate-y-0.5 disabled:translate-0 transition-transform duration-200 py-4 px-3 bg-black rounded-md mt-3">
            {loading ? 'Connecting...' : connected ? 'Wallet Connected!' : 'Connect to MetaMask'}
          </button>
          {!!accountAddress && (
            <p>{accountAddress}</p>
          )}
        </div>
        <form onSubmit={handleSubmit} className="py-6 flex justify-between">
          <input
            disabled={loading}
            type="text"
            placeholder="What do You need to do?"
            value={loading ? "Loading..." : task}
            onChange={(e) => setTask(e.target.value)}
            className="py-2 px-1 w-full focus:outline-0 border-b"
          />
        </form>
        <ul>
          {listItems.map((list, i) => (
            <ListItem isLoading={loading} done={list.isComplete} key={i} onDone={() => handleDone(i)}>
              {list.task}
            </ListItem>
          ))}
        </ul>
      </main>
    </div>
  );
}

export default App;
