let db;

const request = indexedDB.open('budget_tracker', 1);

// set up connection to IndexedDB database called 'budget_tracker'
request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// checks if the app is online, if it is it will run run uploadTracker()
request.onsuccess = function (event) {
    db = event.target.result;

    if (navigator.onLine) {
        uploadTracker();
    }
};

// console logs error code
request.onerror = function (event) {
    console.log(event.target.errorCode);
};

// This function will run if we try to submit a new transaction and there's no internet connection
function saveRecord(record) {
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    const dataObjectStore = transaction.objectStore('new_transaction');

    dataObjectStore.add(record);
};

// Function that collects data from "new_transaction" object store and POST it to the server
function uploadTracker() {
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    const dataObjectStore = transaction.objectStore('new_transaction');

    const getAll = dataObjectStore.getAll();

    getAll.onsuccess = function() {
        if(getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message) {
                    throw new Error(serverResponse);
                }
                const transaction = db.transaction(['new_transaction'], 'readwrite');

                const dataObjectStore = transaction.objectStore('new_transaction');

                dataObjectStore.clear();

            })
            .catch(err => {
                console.log(err);
            })
        }
    };
}

// Window event listener that for the application regains internet connection
window.addEventListener('online', uploadTracker);