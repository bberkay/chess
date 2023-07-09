class Alert{
    /**
     * @static
     * Show Alert
     * @param {AlertMessage} msg Message to be shown
     * @returns {void}
     */
    static showAlert(msg){
        // Show alert layer
        let alert_layer = document.getElementsByClassName("alert-layer")[0];
        alert_layer.style.display = "block";

        // Show alert
        let alert = document.getElementById("alert");
        alert.style.display = "block";

        // Set alert message
        let alert_msg = document.getElementById("alert-text");
        alert_msg.innerHTML = msg;
    }

    /**
     * @static
     * Show Confirm
     * @param {ConfirmMessage} msg Message to be shown
     * @returns {Promise} True if user clicked on "OK" button, false otherwise
     */
    static showConfirm(msg){
        // Show alert layer
        let alert_layer = document.getElementsByClassName("alert-layer")[0];
        alert_layer.style.display = "block";

        // Show confirm
        let confirm = document.getElementById("confirm");
        confirm.style.display = "block";

        // Show confirm message
        let confirm_msg = document.getElementById("confirm-text");
        confirm_msg.innerHTML = msg;

        // Find confirm buttons
        let cancel = document.getElementById("confirm-cancel");
        let ok = document.getElementById("confirm-ok");

        return new Promise((resolve, reject) => {
            ok.addEventListener("click", () => {
                Alert.hide();
                resolve(true);
            });

            cancel.addEventListener("click", () => {
                Alert.hide();
                resolve(false);
            }
        )});
    }

    /**
     * @static
     * Hide alert that is shown
     * @returns {void}
     */
    static hide(){
        // Hide alert layer
        let alert_layer = document.getElementsByClassName("alert-layer")[0];
        alert_layer.style.display = "none";

        // Hide alerts
        Array.from(document.getElementsByClassName("alert")).map((alert) => { alert.style.display = "none"; });
    }
}