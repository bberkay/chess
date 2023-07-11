class AlertHandler {
    /**
     * @static
     * Show AlertHandler
     * @param {AlertMessage|string} msg Message to be shown
     * @returns {void}
     */
    static showAlert(msg){
        // Show alert layer
        document.getElementsByClassName("alert-layer")[0].style.display = "block";

        // Disable scroll
        document.body.style.overflow = "hidden";

        // Show alert
        document.getElementById("alert").style.display = "block";

        // Set alert message
        document.getElementById("alert-text").innerHTML = msg;
    }

    /**
     * @static
     * Show Confirm
     * @param {ConfirmMessage|string} msg Message to be shown
     * @returns {Promise} True if user clicked on "OK" button, false otherwise
     */
    static showConfirm(msg){
        // Show alert layer
        document.getElementsByClassName("alert-layer")[0].style.display = "block";

        // Disable scroll
        document.body.style.overflow = "hidden";

        // Show confirm
        document.getElementById("confirm").style.display = "block";

        // Show confirm message
        document.getElementById("confirm-text").innerHTML = msg;

        // Return promise
        return new Promise((resolve, reject) => {
            document.getElementById("confirm-ok").addEventListener("click", () => {
                AlertHandler.hide();
                resolve(true);
            });

            document.getElementById("confirm-cancel").addEventListener("click", () => {
                AlertHandler.hide();
                resolve(false);
            }
        )});
    }

    /**
     * @static
     * Show detail of log
     * @param {string} file_path
     * @param {string} funcName
     * @param {any }detail
     * @returns {void}
     */
    static showDetail(file_path, funcName, detail){
        // Show alert layer
        document.getElementsByClassName("alert-layer")[0].style.display = "block";

        // Disable scroll
        document.body.style.overflow = "hidden";

        // Show Detail
        document.getElementById("file-path").innerHTML = file_path + " | " + funcName + "()";

        // Show detail
        document.getElementById("detail").style.display = "block";

        // Set detail message
        document.getElementById("detail-text").innerHTML = JSON.stringify(detail, null, 4);
    }

    /**
     * @static
     * Hide alert that is shown
     * @returns {void}
     */
    static hide(){
        // Hide alert layer
        document.getElementsByClassName("alert-layer")[0].style.display = "none";

        // Enable scroll
        document.body.style.overflow = "auto";

        // Hide alerts
        Array.from(document.getElementsByClassName("alert")).map((alert) => { alert.style.display = "none"; });
    }
}