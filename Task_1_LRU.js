class ListNode {
    constructor(key, value) {
        this.key = key;   // stores the key 
        this.value = value; 
        this.prev = null;  
        this.next = null;  
    }
}

class LRUCache {
    constructor(capacity) {
        this.capacity = capacity; // maximum no. of items the cache can hold
        this.storage = new Map();   // map to store key -> node reference for O(1) 
        
        // dummy head and tail nodes to simplify boundary conditions
        this.head = new ListNode(null, null); // least Recently Used (LRU) marker
        this.tail = new ListNode(null, null); // most Recently Used (MRU) marker
       
        // initialize doubly linked list with dummy nodes
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }


    // remove a node from the doubly linked list
    // _remove(node) ensures the correct removal of a node from the Doubly Linked List in O(1) time.
    // it bypasses the node by linking its previous and next nodes directly.
    _remove(node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }
    
    // MRU node should be at the end of the list.
    _insertAtEnd(node) {
        node.prev = this.tail.prev; // connect to the current last node
        node.next = this.tail;      // connect to the dummy tail
        this.tail.prev.next = node; // update previous last node's next pointer
        this.tail.prev = node;      // update tail's previous pointer
    }
    
    // Get a value from the storage
    get(key) {
        if (!this.storage.has(key)) return -1; //nothing is there return -1


        const node = this.storage.get(key); 
        this._remove(node);               // remove node from its current position
        this._insertAtEnd(node);          // move it to the most recently used position
        return node.value;                // return the value of the accessed key
    }


    // insert a new key-value pair into the storage
    put(key, value) {
        if (this.storage.has(key)) {
            // if key already exists, remove the old node
            const existingNode = this.storage.get(key);
            this._remove(existingNode);
        } else if (this.storage.size >= this.capacity) {
            // if storage is full, remove the least recently used (LRU) node
            const leastNode = this.head.next; // LRU node is next to head
            this._remove(leastNode);
            this.storage.delete(leastNode.key); // remove from the hash map
        }


        // insert new node at the most recently used position
        const newNode = new ListNode(key, value);
        this._insertAtEnd(newNode);
        this.storage.set(key, newNode);
    }
    
    // display the current state of the storage
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

const least = new LRUCache(4);
least.put(1, "Apple");  //  [1]
least.put(2, "Banana");  //  [1, 2]
least.put(3, "Car");  //  [1, 2, 3]
least.put(4, "Deer");  //  [1, 2, 3, 4]
least.get(1);       // move 1 to most recently used ->  [2, 3, 4, 1]
least.get(2);       // move 2 to most recently used -> [3, 4, 1, 2]
least.put(5, "Elder");  // evicts least recently used (3) ->  [4, 1, 2, 5]
least.display();    // Output- storage state- [4, 1, 2, 5]
