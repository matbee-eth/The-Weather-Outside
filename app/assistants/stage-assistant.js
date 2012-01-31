function StageAssistant() {
	/* this is the creator function for your stage assistant object */
}

StageAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the stage is first created */
	this.cookie = new Mojo.Model.Cookie("LocationPrefs");
	var locationPrefs = this.cookie.get();
	if (!locationPrefs) {
		this.controller.pushScene('FirstStart', { firstStart : true });
	}
	else { this.controller.pushScene("Setup"); }
};
