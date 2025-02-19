// object to store JSON data
let dummyData = {};

// load JSON data from data.json file
fetch("data.json") // fetch JSON 
    .then(response => response.json())
    .then(data => {
        dummyData = data;
        console.log("JSON data loaded", dummyData);
    })
    .catch(error => console.error("Error loading data:", error));

// node structure for doubly linked list used in LRU Cache
class ListNode {
    constructor(key, value) {
        this.key = key;
        this.value = value;
        this.prev = null;
        this.next = null;
    }
}

// least recently used (LRU) cache implementation 
class LRUCache {
    constructor(capacity) {
        this.capacity = capacity; // max storage capacity
        this.storage = new Map(); // hashmap for O(1) access

        // dummy head and tail nodes for easier linked list operations
        this.head = new ListNode(null, null);
        this.tail = new ListNode(null, null);
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    // remove node from the linked list
    _remove(node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    // insert node at the end (most recently used position)
    _insertAtEnd(node) {
        node.prev = this.tail.prev;
        node.next = this.tail;
        this.tail.prev.next = node;
        this.tail.prev = node;
    }

    // retrieve value from cache, move to most recently used position
    get(key) {
        if (!this.storage.has(key)) return -1;

        const node = this.storage.get(key);
        this._remove(node);
        this._insertAtEnd(node);
        return node.value;
    }

    // insert or update key-value pair in cache
    put(key, value) {
        if (this.storage.has(key)) {
            const existingNode = this.storage.get(key);
            this._remove(existingNode);
        }
        else if (this.storage.size >= this.capacity) {
            // remove least recently used item
            const leastNode = this.head.next;
            this._remove(leastNode);
            this.storage.delete(leastNode.key);
        }

        const newNode = new ListNode(key, value);
        this._insertAtEnd(newNode);
        this.storage.set(key, newNode);
    }

    // display the current cache keys in order
    display() {
        let output = [];
        let current = this.head.next;
        while (current !== this.tail) {
            output.push(current.key);
            current = current.next;
        }
        console.log("storage", output);
    }
}

// AI agent utilizing LRU caching for query optimization
class AI_Agent {
    constructor(cacheSize) {
        this.cache = new LRUCache(cacheSize);
        this.previousQueries = []; // stores user query history
    }

    // process user query and return response
    processQuery(userQuery) {
        if (!dummyData.clients) {
            console.log("Data not loaded yet.");
            return "Data not loaded yet. please wait.";
        }

        const formattedQuery = this.formatQuery(userQuery);
        let response = this.cache.get(formattedQuery);

        if (response !== -1) {
            console.log("Returning cached result.");
            return `Previously asked: ${response}`;
        }

        response = this.searchData(userQuery);
        if (!response) {
            console.log("No matching data found.");
            return "Sorry, no data available for this query.";
        }

        // store query and response in cache
        this.previousQueries.push(userQuery);
        this.cache.put(formattedQuery, response);
        console.log("Fetched from database and stored in cache.");

        return response;
    }

    // format user query by removing special characters and standardizing case
    formatQuery(query) {
        query = query.trim().toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ");

        const examples =
        {
            "account balance of john in 2023": "The account balance of John in 2023 is $1000.",
            "transactions of jane in 2022": "Transactions for Jane in 2022: Date: 01-01-2022, Amount: $500, Description: Rent payment."
        };

        return examples[query] || query;
    }

    // extract query details and search in JSON data
    searchData(query) {
        let match = query.match(/(account balance|transactions|incomes|expenses) of (.+?) in (\d{4})/i);
        if (!match) return null;

        const queryType = match[1].toLowerCase();
        const clientName = match[2].toLowerCase();
        const year = match[3];

        // find matching client
        const matchingClients = dummyData.clients.filter(c => c.client_name.toLowerCase().includes(clientName));
        if (matchingClients.length === 0) return null;
        if (matchingClients.length > 1) return `Multiple clients found: ${matchingClients.map(c => c.client_name).join(", ")}. Please be more specific.`;

        const client = matchingClients[0];
        if (!client[year]) return null;

        if (queryType.includes("balance")) {
            return `The account balance of ${client.client_name} in ${year} is $${client[year].account_balance}.`;
        }
        else if (queryType.includes("transactions")) {
            return `Transactions for ${client.client_name} in ${year}:<br>${client[year].transactions.map(t => `Date: ${t.date}, Amount: ${t.amount}, Description: ${t.description}`).join("<br>")}`;
        }
        else if (queryType.includes("incomes")) {
            return `Income transactions for ${client.client_name} in ${year}:<br>${client[year].transactions.filter(t => t.amount > 0).map(t => `Date: ${t.date}, Amount: ${t.amount}, Description: ${t.description}`).join("<br>")}`;
        }
        else if (queryType.includes("expenses")) {
            return `Expense transactions for ${client.client_name} in ${year}:<br>${client[year].transactions.filter(t => t.amount < 0).map(t => `Date: ${t.date}, Amount: ${t.amount}, Description: ${t.description}`).join("<br>")}`;
        }

        return null;
    }
}

// initialize AI agent  size 4
const agent = new AI_Agent(4);

// function to handle user queries from input field
function processQuery() {
    const inputField = document.getElementById("queryInput");
    const responseDiv = document.getElementById("response");
    const userQuery = inputField.value.trim();

    if (userQuery === "") {
        responseDiv.innerHTML = "Please enter a query.";
        return;
    }

    const result = agent.processQuery(userQuery);
    responseDiv.innerHTML = result;
}
