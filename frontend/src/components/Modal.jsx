export default function Modal({ isOpen, onClose, title, children, fullHeight }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />

      {/* Modal */}
      <div className={`relative bg-gray-800 shadow-xl w-full flex flex-col p-6
        ${fullHeight
          ? 'max-w-md max-h-screen rounded-none mx-0'
          : 'max-w-md rounded-lg mx-2 sm:mx-4 max-h-[85vh]'}`}>
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-100">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">✕</button>
        </div>
        <div className={fullHeight ? 'flex-1 flex flex-col min-h-0 overflow-hidden' : 'overflow-y-auto'}>
          {children}
        </div>
      </div>
    </div>
  );
}
