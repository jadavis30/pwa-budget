// create variable to hold db connection
let db;
// establish a connection to IndexedDB database and set it to version 1
const request = indexedDB.open('pwa_budget', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
  };

request.onsuccess = function(event) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;
  
    // check if app is online, if yes run uploadPizza() function to send all local db data to api
    if (navigator.onLine) {
      uploadTransaction();
    }
  };
  
request.onerror = function(event) {
  console.log(event.target.errorCode);
};

  // This function will be executed if we attempt to submit a new transaction and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access the object store for `new_transaction`
    const transactionObjectStore = transaction.objectStore('new_transaction');
  
    // add record to your store with add method
    transactionObjectStore.add(record);
};

  //This function is executed to get all transactions saved offline and return
function getRecords() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['new_transaction'], 'readonly');
    const transactionObjectStore = transaction.objectStore('new_transaction');
    const getAll = transactionObjectStore.getAll();
    getAll.onsuccess = function() {
      if (getAll.result.length > 0) {
        resolve(getAll.result);
      };
      reject(Error('No data stored offline'));
    };
  }).catch((err) => {
    console.log('No data stored offline')
  });
};

function uploadTransaction() {
  // open a transaction on your db
  const transaction = db.transaction(['new_transaction'], 'readwrite');

  // access your object store
  const transactionObjectStore = transaction.objectStore('new_transaction');

  // get all records from store and set to a variable
  const getAll = transactionObjectStore.getAll();
    // upon a successful .getAll() execution, run this function
  getAll.onsuccess = function() {
    // if there was data in indexedDb's store, send it to the api server
    if (getAll.result.length > 0) {
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
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(['new_transaction'], 'readwrite');
          const transactionObjectStore = transaction.objectStore('new_transaction');
          // clear all items in your store
          transactionObjectStore.clear();

          alert("All offline transactions were saved!");
        })
        .catch(err => {
          console.log(err);
        });
      }
  };
}

  // listen for app coming back online
window.addEventListener('online', uploadTransaction);