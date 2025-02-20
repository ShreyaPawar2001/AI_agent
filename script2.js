const { NlpManager } = require("node-nlp");
const fs = require("fs");
const path = require("path");
const dataPath = path.join(__dirname, "data.json");
const rawData = fs.readFileSync(dataPath, "utf-8");
const financialData = JSON.parse(rawData);
console.log("data is loaded");
//LRU Implementation
class ListNode { 
    constructor(key, value) {
        this.key = key;
        this.value = value;
        this.prev = null;
        this.next = null;
    }
}
class LRUCache {
    constructor(capacity) {
        this.capacity = capacity;
        this.storage = new Map();
        this.head = new ListNode(null, null);
        this.tail = new ListNode(null, null);
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    _remove(node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }
     _insertAtEnd(node) {
        node.prev = this.tail.prev;
        node.next = this.tail;
        this.tail.prev.next = node;
        this.tail.prev = node;
    }
    get(key) {
        if (!this.storage.has(key)) return -1;
        const node = this.storage.get(key);
        this._remove(node);
        this._insertAtEnd(node);
        return node.value;
    }
    put(key, value) {
        if (this.storage.has(key)) {
            const existingNode = this.storage.get(key);
            this._remove(existingNode);
        } else if (this.storage.size >= this.capacity) {
            const leastNode = this.head.next;
            console.log(`removed least recently used query: "${leastNode.key}"`);
            this._remove(leastNode);
            this.storage.delete(leastNode.key);
        }
        const newNode = new ListNode(key, value);
        this._insertAtEnd(newNode);
        this.storage.set(key, newNode);
    }
    display() {
        let output = [];
        let current = this.head.next;
        while (current !== this.tail) {
            output.push(current.key);
            current = current.next;
        }
        console.log("Cache :", output);
    }
}


const cache = new LRUCache(4);

// NLP manager
const manager = new NlpManager({ languages: ["en"] });

financialData.clients.forEach(client => {
    manager.addNamedEntityText("client_name", client.client_name, ["en"], [client.client_name.toLowerCase()]);
    Object.keys(client).forEach(year => {
        if (!isNaN(year)) {
            manager.addNamedEntityText("year", year, ["en"], [year]);
        }
    });
});

// addded NLP doc
manager.addDocument("en", "What is the account balance of %client_name% in %year%?", "finance.account_balance");
manager.addDocument("en", "%client_name% account balance for %year%", "finance.account_balance");
manager.addDocument("en", "Balance of %client_name% in %year%", "finance.account_balance");

async function trainModel() {
    await manager.train();
    manager.save();
    console.log("NLP model trained");
}

async function getResponse(query) {
    const cachedResult = cache.get(query);
    if (cachedResult !== -1) {
        console.log("returning cached result");
        return cachedResult;
    }
    const response = await manager.process("en", query);
    const entities = response.entities;

    const clientEntity = entities.find(e => e.entity === "client_name");
    const yearEntity = entities.find(e => e.entity === "year");

    if (!clientEntity || !yearEntity) {
        return "I need both client name and year to answer.";
    }

    const clientName = clientEntity.option;
    const year = yearEntity.option;


    const client = financialData.clients.find(c => c.client_name.toLowerCase() === clientName.toLowerCase());

    if (!client || !client[year]) {
        return `No financial data found for ${clientName} in ${year}.`;
    }

    const accountBalance = client[year].account_balance;
    const result = `${clientName}'s account balance for ${year} is $${accountBalance}.`;

    cache.put(query, result);

    return result;
}

const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
});

trainModel().then(() => {
    const askQuestion = () => {
        readline.question("Enter your query: ", async (query) => {
            let response = await getResponse(query);
            console.log(`AI Response: ${response}`);
            cache.display();

            askQuestion(); 
        });
    };

    askQuestion();
});
