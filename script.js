/*
    B+ TREE IMPLEMENTATION

    Order = 4

    Maximum keys in a leaf = 3
    Maximum children in an internal node = 4
*/


const ORDER = 4;
const MAX_KEYS = ORDER - 1;


/* =========================================
   B+ TREE NODE
========================================= */

class BPlusNode {

    constructor(isLeaf = false) {

        this.isLeaf = isLeaf;

        // Keys stored in this node
        this.keys = [];

        // Children for internal nodes
        this.children = [];

        // Pointer to next leaf
        this.next = null;

        // Parent node
        this.parent = null;
    }
}


/* =========================================
   B+ TREE
========================================= */

class BPlusTree {

    constructor() {

        // Initially root is an empty leaf
        this.root = new BPlusNode(true);
    }


    /* =====================================
       FIND LEAF
    ===================================== */

    findLeaf(key) {

        let current = this.root;

        while (!current.isLeaf) {

            let i = 0;

            while (
                i < current.keys.length &&
                key >= current.keys[i]
            ) {
                i++;
            }

            current = current.children[i];
        }

        return current;
    }


    /* =====================================
       SEARCH
    ===================================== */

    search(key) {

        const leaf = this.findLeaf(key);

        return leaf.keys.includes(key);
    }


    /* =====================================
       INSERT
    ===================================== */

    insert(key) {

        const leaf = this.findLeaf(key);

        // Prevent duplicate keys
        if (leaf.keys.includes(key)) {

            return false;
        }

        // Add key
        leaf.keys.push(key);

        // Sort keys
        leaf.keys.sort((a, b) => a - b);

        // Split if necessary
        if (leaf.keys.length > MAX_KEYS) {

            this.splitLeaf(leaf);
        }

        return true;
    }


    /* =====================================
       SPLIT LEAF
    ===================================== */

    splitLeaf(leaf) {

        const middle =
            Math.ceil(leaf.keys.length / 2);

        const newLeaf =
            new BPlusNode(true);

        // Move second half
        newLeaf.keys =
            leaf.keys.splice(middle);

        // Maintain leaf linked list
        newLeaf.next = leaf.next;

        leaf.next = newLeaf;

        newLeaf.parent = leaf.parent;

        // First key of new leaf is promoted
        const promotedKey =
            newLeaf.keys[0];


        /* If leaf is root */

        if (leaf === this.root) {

            const newRoot =
                new BPlusNode(false);

            newRoot.keys = [
                promotedKey
            ];

            newRoot.children = [
                leaf,
                newLeaf
            ];

            leaf.parent = newRoot;

            newLeaf.parent = newRoot;

            this.root = newRoot;

        }

        else {

            this.insertIntoParent(
                leaf,
                promotedKey,
                newLeaf
            );
        }
    }


    /* =====================================
       INSERT INTO PARENT
    ===================================== */

    insertIntoParent(left, key, right) {

        const parent = left.parent;

        const index =
            parent.children.indexOf(left);

        // Insert key
        parent.keys.splice(
            index,
            0,
            key
        );

        // Insert child
        parent.children.splice(
            index + 1,
            0,
            right
        );

        right.parent = parent;


        // Split parent if necessary
        if (parent.children.length > ORDER) {

            this.splitInternal(parent);
        }
    }


    /* =====================================
       SPLIT INTERNAL NODE
    ===================================== */

    splitInternal(node) {

        const middleIndex =
            Math.floor(node.keys.length / 2);

        const promotedKey =
            node.keys[middleIndex];

        const rightNode =
            new BPlusNode(false);


        // Keys for right node
        rightNode.keys =
            node.keys.splice(
                middleIndex + 1
            );


        // Children for right node
        rightNode.children =
            node.children.splice(
                middleIndex + 1
            );


        // Update parent references
        rightNode.children.forEach(
            child => {
                child.parent = rightNode;
            }
        );


        // Remove promoted key
        node.keys.splice(middleIndex);

        rightNode.parent =
            node.parent;


        /* If node is root */

        if (node === this.root) {

            const newRoot =
                new BPlusNode(false);

            newRoot.keys = [
                promotedKey
            ];

            newRoot.children = [
                node,
                rightNode
            ];

            node.parent = newRoot;

            rightNode.parent = newRoot;

            this.root = newRoot;
        }

        else {

            this.insertIntoParent(
                node,
                promotedKey,
                rightNode
            );
        }
    }


    /* =====================================
       DELETE
    ===================================== */

    delete(key) {

        const leaf =
            this.findLeaf(key);

        const index =
            leaf.keys.indexOf(key);

        if (index === -1) {

            return false;
        }

        // Remove key
        leaf.keys.splice(index, 1);


        /*
            If leaf becomes empty,
            remove the leaf.
        */

        if (
            leaf !== this.root &&
            leaf.keys.length === 0
        ) {

            this.removeEmptyLeaf(leaf);
        }

        return true;
    }


    /* =====================================
       REMOVE EMPTY LEAF
    ===================================== */

    removeEmptyLeaf(leaf) {

        const parent = leaf.parent;

        if (!parent) {

            return;
        }

        const index =
            parent.children.indexOf(leaf);


        // Remove leaf
        parent.children.splice(
            index,
            1
        );


        // Remove separator key
        if (index < parent.keys.length) {

            parent.keys.splice(
                index,
                1
            );

        }

        else if (parent.keys.length > 0) {

            parent.keys.pop();
        }


        /*
            If root has only one child,
            make child the new root.
        */

        if (
            parent === this.root &&
            parent.children.length === 1
        ) {

            this.root =
                parent.children[0];

            this.root.parent = null;
        }
    }


    /* =====================================
       GET TREE LEVELS
    ===================================== */

    getLevels() {

        const levels = [];

        let currentLevel = [
            this.root
        ];


        while (currentLevel.length > 0) {

            levels.push(currentLevel);

            const nextLevel = [];


            currentLevel.forEach(node => {

                if (!node.isLeaf) {

                    node.children.forEach(
                        child => {

                            nextLevel.push(child);

                        }
                    );
                }

            });


            currentLevel = nextLevel;
        }

        return levels;
    }


    /* =====================================
       GET LEAF VALUES
    ===================================== */

    getAllValues() {

        let node = this.root;


        // Find first leaf
        while (!node.isLeaf) {

            node = node.children[0];
        }


        const values = [];


        // Follow linked leaves
        while (node) {

            values.push(
                ...node.keys
            );

            node = node.next;
        }


        return values;
    }
}


/* =========================================
   CREATE TREE
========================================= */

const tree =
    new BPlusTree();


/* =========================================
   HTML ELEMENTS
========================================= */

const valueInput =
    document.getElementById("valueInput");

const insertBtn =
    document.getElementById("insertBtn");

const searchBtn =
    document.getElementById("searchBtn");

const deleteBtn =
    document.getElementById("deleteBtn");

const clearBtn =
    document.getElementById("clearBtn");

const message =
    document.getElementById("message");

const treeDiv =
    document.getElementById("tree");

const leafSequence =
    document.getElementById("leafSequence");


/* =========================================
   INSERT BUTTON
========================================= */

insertBtn.addEventListener(
    "click",
    function () {

        const value =
            Number(valueInput.value);


        if (valueInput.value === "") {

            showMessage(
                "Please enter a number."
            );

            return;
        }


        if (tree.insert(value)) {

            showMessage(
                value +
                " inserted successfully."
            );

        }

        else {

            showMessage(
                value +
                " already exists."
            );
        }


        valueInput.value = "";

        renderTree();
    }
);


/* =========================================
   SEARCH BUTTON
========================================= */

searchBtn.addEventListener(
    "click",
    function () {

        const value =
            Number(valueInput.value);


        if (valueInput.value === "") {

            showMessage(
                "Please enter a number."
            );

            return;
        }


        if (tree.search(value)) {

            showMessage(
                value +
                " found in B+ Tree."
            );

        }

        else {

            showMessage(
                value +
                " not found."
            );
        }
    }
);


/* =========================================
   DELETE BUTTON
========================================= */

deleteBtn.addEventListener(
    "click",
    function () {

        const value =
            Number(valueInput.value);


        if (valueInput.value === "") {

            showMessage(
                "Please enter a number."
            );

            return;
        }


        if (tree.delete(value)) {

            showMessage(
                value +
                " deleted successfully."
            );

        }

        else {

            showMessage(
                value +
                " not found."
            );
        }


        valueInput.value = "";

        renderTree();
    }
);


/* =========================================
   CLEAR BUTTON
========================================= */

clearBtn.addEventListener(
    "click",
    function () {

        tree.root =
            new BPlusNode(true);

        showMessage(
            "B+ Tree cleared."
        );

        renderTree();
    }
);


/* =========================================
   SHOW MESSAGE
========================================= */

function showMessage(text) {

    message.textContent = text;
}


/* =========================================
   RENDER TREE
========================================= */

function renderTree() {

    treeDiv.innerHTML = "";

    const levels =
        tree.getLevels();


    levels.forEach(
        (level, levelIndex) => {


            /* Level label */

            const label =
                document.createElement("div");

            label.className =
                "level-label";

            label.textContent =
                "Level " +
                levelIndex;

            treeDiv.appendChild(label);


            /* Level */

            const levelDiv =
                document.createElement("div");

            levelDiv.className =
                "level";


            /* Nodes */

            level.forEach(node => {

                const nodeDiv =
                    document.createElement("div");

                nodeDiv.className =
                    "node";


                if (node.isLeaf) {

                    nodeDiv.classList.add(
                        "leaf"
                    );
                }


                /* Keys */

                if (node.keys.length === 0) {

                    const keyDiv =
                        document.createElement("div");

                    keyDiv.className =
                        "key";

                    keyDiv.textContent =
                        "Empty";

                    nodeDiv.appendChild(
                        keyDiv
                    );
                }


                else {

                    node.keys.forEach(key => {

                        const keyDiv =
                            document.createElement(
                                "div"
                            );

                        keyDiv.className =
                            "key";

                        keyDiv.textContent =
                            key;

                        nodeDiv.appendChild(
                            keyDiv
                        );

                    });
                }


                levelDiv.appendChild(
                    nodeDiv
                );

            });


            treeDiv.appendChild(
                levelDiv
            );

        }
    );


    /* Leaf sequence */

    const values =
        tree.getAllValues();


    if (values.length > 0) {

        leafSequence.textContent =
            "Leaf Sequence: " +
            values.join(" → ");

    }

    else {

        leafSequence.textContent =
            "Leaf Sequence: Empty";
    }
}


/* =========================================
   ENTER KEY
========================================= */

valueInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            insertBtn.click();
        }
    }
);


/* =========================================
   INITIAL TREE
========================================= */

renderTree();