function ListItem({ children, onDone, done, isLoading }) {
  return <li className={`mb-4 p-4 ${done ? 'bg-gray-300' : 'bg-white'} rounded-sm shadow-md text-black flex items-center justify-between ${!!done && 'line-through'}`}>
    {children}
    <button onClick={onDone} disabled={isLoading} className="py-1 px-3 cursor-pointer bg-violet-600 disabled:bg-violet-600/50 text-white rounded-sm">Selesai</button>
  </li>
}

export default ListItem;