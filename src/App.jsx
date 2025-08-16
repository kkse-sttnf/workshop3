import { useEffect, useState } from "react";
import ListItem from "./listItem";
import { createPublicClient, http } from 'viem';
import { baseSepolia } from "viem/chains";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain
} from 'wagmi';
import todolistContract from "./utils/abi";

function App() {
  const [task, setTask] = useState('');
  const [listItems, setListItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const { contractAddress, abi } = todolistContract;

  // Wagmi hooks
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  // Write contract hooks untuk sponsored transactions
  const {
    writeContract: writeAddTask,
    data: addTaskHash,
    isPending: isAddingTask
  } = useWriteContract();

  const {
    writeContract: writeCompleteTask,
    data: completeTaskHash,
    isPending: isCompletingTask
  } = useWriteContract();

  // Transaction receipt hooks
  const { isLoading: isAddTaskConfirming } = useWaitForTransactionReceipt({
    hash: addTaskHash,
  });

  const { isLoading: isCompleteTaskConfirming } = useWaitForTransactionReceipt({
    hash: completeTaskHash,
  });

  // Public client untuk reading data
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  // Function untuk mendapatkan task berdasarkan ID
  const getTask = async (id) => {
    try {
      const [task, isComplete] = await publicClient.readContract({
        address: contractAddress,
        abi,
        args: [id],
        functionName: 'getTask',
      });

      return { task, isComplete };
    } catch (err) {
      console.error("Error get task:", err);
      return null;
    }
  };

  // Function untuk mendapatkan semua task
  const getAllTask = async () => {
    try {
      setLoading(true);
      setStatus('Getting all tasks...');

      const countTask = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'getTaskCount',
      });

      const tasks = [];
      for (let i = 0; i < countTask; i++) {
        const taskData = await getTask(i);
        if (taskData) {
          tasks.push(taskData);
        }
      }

      setListItems(tasks);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to fetch tasks");
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  // Initialize - load tasks on component mount
  useEffect(() => {
    getAllTask();
  }, []);

  // Handle chain switching jika tidak di Base Sepolia
  useEffect(() => {
    if (isConnected && chain?.id !== baseSepolia.id) {
      switchChain({ chainId: baseSepolia.id });
    }
  }, [isConnected, chain, switchChain]);

  // Listen untuk transaction confirmations
  useEffect(() => {
    if (addTaskHash && !isAddTaskConfirming) {
      setStatus('Task added successfully!');
      setTask('');
      getAllTask();
      setTimeout(() => setStatus(''), 3000);
    }
  }, [addTaskHash, isAddTaskConfirming]);

  useEffect(() => {
    if (completeTaskHash && !isCompleteTaskConfirming) {
      setStatus('Task completed successfully!');
      getAllTask();
      setTimeout(() => setStatus(''), 3000);
    }
  }, [completeTaskHash, isCompleteTaskConfirming]);

  // Function untuk koneksi wallet
  const handleConnect = async () => {
    try {
      setError('');
      // Gunakan Coinbase Smart Wallet connector yang mendukung paymaster
      const coinbaseConnector = connectors.find(
        (connector) => connector.id === 'coinbaseWalletSDK'
      );

      if (coinbaseConnector) {
        connect({ connector: coinbaseConnector });
      } else {
        // Fallback ke connector pertama yang tersedia
        connect({ connector: connectors[0] });
      }
    } catch (err) {
      console.error('Connection error:', err);
      setError('Failed to connect wallet');
    }
  };

  // Function untuk menambah task
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!task.trim()) {
      setError("Task can't be empty");
      return;
    }

    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      setError('');
      setStatus('Adding task with sponsored transaction...');

      // Gunakan writeContract dengan paymaster support
      writeAddTask({
        address: contractAddress,
        abi,
        functionName: 'addTask',
        args: [task],
        // Sponsored transaction configuration
        gas: 100000n, // Set gas limit
        paymaster: true, // Enable paymaster jika didukung connector
      });

    } catch (err) {
      console.error("Error adding task:", err);
      setError(`Failed to add task: ${err.message}`);
      setStatus('');
    }
  };

  // Function untuk menyelesaikan task
  const handleDone = async (id) => {
    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      setError('');
      setStatus('Completing task with sponsored transaction...');

      writeCompleteTask({
        address: contractAddress,
        abi,
        functionName: 'completeTask',
        args: [id],
        gas: 100000n,
        paymaster: true,
      });

    } catch (err) {
      console.error("Error completing task:", err);
      setError(`Failed to complete task: ${err.message}`);
      setStatus('');
    }
  };

  const isTransactionPending = isAddingTask || isCompletingTask ||
    isAddTaskConfirming || isCompleteTaskConfirming;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-900 to-indigo-600 py-12 px-4 flex justify-center w-full">

      {/* Status Messages */}
      {status && (
        <div className="fixed top-8 left-8 text-white z-50">
          {status}
        </div>
      )}

      {error && (
        <div className="fixed top-8 right-8 text-red-500 z-50">
          {error}
          <button
            onClick={() => setError('')}
            className="ml-2 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      )}

      <main className="py-12 max-w-2xl w-full">
        <h1 className="text-5xl md:text-6xl font-medium text-white mb-8">
          Todolist with Blockchain
        </h1>

        <div className="mb-8">
          <div className="flex items-center flex-wrap gap-4 justify-between mb-4">
            {!isConnected ? (
              <button
                disabled={isPending}
                onClick={handleConnect}
                className="cursor-pointer disabled:cursor-default hover:-translate-y-0.5 disabled:translate-0 transition-transform duration-200 py-4 px-3 bg-black rounded-md mt-3"
              >
                {isPending ? 'Connecting...' : 'Connect To Wallet'}
              </button>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="text-green-400 font-semibold">
                  ✓ Wallet Connected!
                </div>
                <button
                  onClick={() => disconnect()}
                  className="text-white hover:text-white text-sm px-2 py-1 bg-black rounded-sm cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            )}

            {isConnected && address && (
              <div className="text-white text-sm">
                <div className="opacity-75">Address:</div>
                <div className="font-mono text-md">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </div>
                {chain && (
                  <div className="text-xs opacity-50">
                    {chain.name}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="">
          <form onSubmit={handleSubmit} className="mb-6 border-b">
            <div className="flex gap-3">
              <input
                disabled={!isConnected || isTransactionPending}
                type="text"
                placeholder="What do you need to do?"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className="flex-1 focus:outline-none text-white"
              />
              <button
                type="submit"
                disabled={!isConnected || !task.trim() || isTransactionPending}
                className="py-3 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isAddingTask || isAddTaskConfirming ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </form>

          <div className="space-y-2">
            {loading ? (
              <div className="py-8 text-gray-200">
                Loading tasks...
              </div>
            ) : listItems.length > 0 ? (
              listItems.map((item, index) => (
                <ListItem
                  key={index}
                  isLoading={isTransactionPending}
                  done={item.isComplete}
                  onDone={() => handleDone(index)}
                >
                  {item.task}
                </ListItem>
              ))
            ) : (
              <div className="py-8 text-gray-200">
                No tasks yet. Add your first task above!
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;