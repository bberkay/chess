class LogHandler{
    #file_path;

    constructor(file_path){
        this.#file_path = file_path;
    }

    /**
     * @private
     * Show log in DOM
     * @param {LogType} logType The type of log
     * @param {string} msg The message to log
     * @param {any} detail The detail to log
     * @param {string} funcName The function name that called the log
     * @returns {void}
     */
    #log(logType, msg, detail, funcName){
        // Find current date
        const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Find clickable section of message
        detail = JSON.stringify(detail).replace(/"/g, "&quot;");
        msg = msg.replace("_", `<span class='clickable' onclick="AlertHandler.showDetail('${this.#file_path}', '${funcName}', ${detail})">`);
        msg = msg.replace("_", `</span>`);


        // Find log element
        let log = document.getElementById("log");

        // Set log message
        let logItem = document.createElement("p");
        logItem.classList.add("log-item");
        logItem.innerHTML = '&#9679; ' + currentDateTime + " | <span class='log-status'>" + logType + "</span> | " + msg;
        log.appendChild(logItem);

        // Scroll to bottom
        log.scrollTop = log.scrollHeight;
    }

    /**
     * @static
     * Info logging
     * @param {string} msg The message to log
     * @param {string} detail The detail to log
     * @param {string} funcName The function name that called the log
     * @returns {void}
     */
    info(msg, detail, funcName){
        this.#log(LogType.Info, msg, detail, funcName);
    }

    /**
     * @static
     * Error logging
     * @param {string} msg The message to log
     * @returns {void}
     */
    error(msg){
        this.#log(msg, LogType.Error);
    }

    /**
     * @static
     * Warning logging
     * @param {string} msg The message to log
     * @returns {void}
     */
    warning(msg){
        this.#log(msg, LogType.Warning);
    }

    /**
     * @static
     * Clear log
     * @returns {void}
     */
    clear(){
        document.getElementById("log").innerHTML = "";
    }
}