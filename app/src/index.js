import Web3 from "web3";

/* Globals */

const MESSAGE_CONTAINER_CLASS = "message-container";
const MESSAGE_CLASS = "message";
const META_CLASS = "meta";

const web3 = new Web3("ws://localhost:8546");

var loginButton;
var accountButtonsContainer;
var messageContainer;
var messageInputContainer;
var toSelect;
var messageInput;
var sendButton;

var account;
var ids = [];
var lastBlockRead = -1;


/* Log-In/Account Management */

/**
 * Attempts to log in, then (if successful) shows the messages/message input.
 */
async function logIn() {
    try {
        account = prompt("Please enter your account address:");
        if (!account) {
            return;
        }

        var password = prompt("Please enter your account passphrase:");
        if (!password) {
            return;
        }

        await unlockAccount(account, password);
    } catch (e) {
        alert("Incorrect Credentials");
        return;
    }
}

/**
 * Attempts to create an account, then (if successful) shows the messages/message input.
 */
async function createAccount() {
    try {
        var password = prompt("Please enter a passphrase for your account:");
        if (!password) {
            return;
        }

        account = await web3.eth.personal.newAccount(password)
        await unlockAccount(account, password);
        alert("Account adress: " + account);
    } catch (e) {
        alert("Something went Wrong!");
        console.log(e);
    }
}

async function unlockAccount(account, password) {
    await web3.eth.personal.unlockAccount(account, password);

    showMessages();
}


/**
 * Gets the account list from the Ethereum network. If any changes were made, deletes the old
 * IDs from the DOM and adds the current IDs.
 */
async function populateIds() {
    const newIds = await web3.eth.personal.getAccounts();
    if (newIds === ids) {
        return;
    }

    ids = newIds;

    for (let child of toSelect.children) {
        child.remove()
    }

    for (let id of ids) {
        const option = createOption(id);
        toSelect.appendChild(option);
    }
}

/* Transaction Sending/Receiving */

async function sendMessage() {
    const messageText = messageInput.value;
    messageInput.value = "";

    const to = toSelect.value;

    const data = JSON.stringify({
        message: messageText
    });
    const transaction = {
        from: account,
        to: to,
        value: 0,
        data: web3.utils.asciiToHex(data)
    };

    web3.eth.sendTransaction(transaction);
}

/**
 * Gets and handles transactions on new blocks.
 */
async function getMessages() {
    let startBlockNumber = lastBlockRead + 1;
    let endBlockNumber = await web3.eth.getBlockNumber();

    for (var i = startBlockNumber; i <= endBlockNumber; i++) {
        var block = await web3.eth.getBlock(i, true);
        if (block && block.transactions !== null) {
            for (let tx of block.transactions) {
                handleTransaction(tx);
            }
            lastBlockRead = block.number;
        }
    }
}


/* Transaction parsing */

/**
 * Handles a transaction by checking if it's a message, then creating and
 * appending a message element to the DOM if it is.
 *
 * @param {*} tx The transaction.
 */
function handleTransaction(tx) {
    const message = transactionToMessage(tx);
    if (!message || !isMessageRelevant(message)) {
        return;
    }

    const messageElement = constructMessageElement(message);
    messageContainer.appendChild(messageElement);
}

/**
 * Converts a transaction into a message object.
 *
 * @param {*} tx The transaction.
 * @returns The message object, or null if conversion fails (i.e. the transaction is not a message).
 */
function transactionToMessage(tx) {
    if (!tx.to || !tx.from || !tx.input) {
        return;
    }

    let messageJson;
    try {
        messageJson = web3.utils.hexToAscii(tx.input);
    } catch (e) {
        return;
    }

    const message = {
        to: tx.to,
        from: tx.from,
        content: JSON.parse(messageJson).message
    };
    return message;
}

/**
 * Determines whether or not a message is relevant to the current user.
 *
 * @param {*} message The message.
 * @returns Whether or not the message is relevant.
 */
function isMessageRelevant(message) {
    return (message.to === account || message.from === account);
}

/**
 * Constructs a message element from a message.
 *
 * @param {*} message The message.
 * @returns The message element.
 */
function constructMessageElement(message) {
    const from = createSpan("Sender:\t\t" + message.from, [`${META_CLASS}__from`]);
    const to = createSpan("Recipient:\t" + message.to, [`${META_CLASS}__to`])

    const content = createSpan(message.content, [`${MESSAGE_CLASS}__content`])

    const meta = createDiv([`${MESSAGE_CLASS}__${META_CLASS}`, META_CLASS], [from, to]);

    const messageElement = createDiv([`${MESSAGE_CONTAINER_CLASS}__message`, "message"], [meta, content])
    return messageElement;
}


/* General */

/**
 * Creates a new div element.
 *
 * @param {*} classList The div's class list.
 * @param {*} children The children of the div.
 * @returns The new div element.
 */
function createDiv(classList, children) {
    const div = document.createElement("div");
    div.classList.add(...classList);
    if (children) {
        for (let child of children) {
            div.appendChild(child);
        }
    }
    return div;
}

/**
 * Creates a new span element.
 *
 * @param {*} text The textContent of the span.
 * @param {*} classList The span's class list.
 * @returns The new span element.
 */
function createSpan(text, classList) {
    const span = document.createElement("span");
    span.textContent = text;
    span.classList.add(...classList);
    return span;
}

/**
 * Creates a new option element.
 *
 * @param {*} value The value of the option.
 * @param {*} text The textContent of the option.
 * @returns the new option.
 */
function createOption(value, text) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text ? text : value;
    return option;
}

function handleMessageInputKeyDown(e) {
    if (!e.ctrlKey || (e.keyCode !== 10 && e.keyCode !== 13)) {
        return;
    }

    e.preventDefault();
    sendMessage();
}

/**
 * Makes the gets the IDs and relevant messages, subscribes to updates to the blockchain,
 * makes messages/message-input visible and hides the log in/create account buttons.
 */
async function showMessages() {
    await populateIds();

    await getMessages();

    web3.eth.subscribe("newBlockHeaders", getMessages);

    messageInputContainer.classList.remove("hidden");
    messageContainer.classList.remove("hidden");
    accountButtonsContainer.classList.add("hidden");
}

/**
 * Called when the DOM is mounted.
 */
function onLoad() {
    loginButton = document.getElementById("loginButton");
    accountButtonsContainer = document.getElementById("accountButtons");
    messageContainer = document.getElementById("messageContainer")
    messageInputContainer = document.getElementById("messageInputContainer");
    toSelect = document.getElementById("toSelect");
    messageInput = document.getElementById("messageInput");
    sendButton = document.getElementById("sendButton");

    loginButton.onclick = logIn;
    createAccountButton.onclick = createAccount;
    sendButton.onclick = sendMessage;

    messageInput.onkeydown = handleMessageInputKeyDown;
}

document.body.onload = onLoad;
