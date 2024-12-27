// ErrorNotification.js
const ErrorNotification = () => {
  return (
    <div className="bg-red-500 text-white px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">Ops!</strong>
      <span className="block sm:inline ml-2">
        Per favore, compila correttamente tutti i campi obbligatori.
      </span>
    </div>
  );
};

export default ErrorNotification;
