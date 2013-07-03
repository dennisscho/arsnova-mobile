/*--------------------------------------------------------------------------+
 This file is part of ARSnova.
 app.js
 - Beschreibung: Einstiegsseite für ARSnova.
 - Version:      1.0, 01/05/12
 - Autor(en):    Christian Thomas Weber <christian.t.weber@gmail.com>
 +---------------------------------------------------------------------------+
 This program is free software; you can redistribute it and/or
 modify it under the terms of the GNU General Public License
 as published by the Free Software Foundation; either version 2
 of the License, or any later version.
 +---------------------------------------------------------------------------+
 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
 You should have received a copy of the GNU General Public License
 along with this program; if not, write to the Free Software
 Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
 +--------------------------------------------------------------------------*/

Ext.application({
	
	requires: ['ARSnova.BrowserDetect', 'ARSnova.proxy.RestProxy', 'ARSnova.WebSocket'],

	startupImage: {
		'320x460': 'resources/images/ARSnova_Grafiken/03_Launchimage_320x460px.png', // iPhone
		'768x1004' : 'resources/images/ARSnova_Grafiken/03_Launchimage_768x1004px.png', // iPad (portrait)
		'748x1024' : 'resources/images/ARSnova_Grafiken/03_Launchimage_748x1024px.png' // iPad (landscape)
	},
	viewport: {
        autoMaximize: Ext.os.is.iOS && Ext.browser.version.isGreaterThan(3)
    },
	icon: {
		57: 'resources/images/ARSnova_Grafiken/01_AppIcon_57x57px.png',
		72: 'resources/images/ARSnova_Grafiken/01_AppIcon_72x72px.png',
		114: 'resources/images/ARSnova_Grafiken/01_AppIcon_114x114px.png'
	},
	
    name: "ARSnova",
    /* const */
    WEBAPP			: 'webapp',
    NATIVE			: 'native',
    APP_URL			: window.location.origin + window.location.pathname,
    WEBSERVICE_URL	: "app/webservices/",
    PRESENTER_URL	: "/presenter/",
    
	LOGIN_GUEST		: "0",
	LOGIN_THM		: "1",
	LOGIN_OPENID	: "2",
	LOGIN_TWITTER	: "3",
	LOGIN_FACEBOOK	: "4",
	LOGIN_GOOGLE	: "5",
	
	USER_ROLE_STUDENT: "0",
	USER_ROLE_SPEAKER: "1",
    
    isIconPrecomposed: true,
    icon: 'resources/images/ARSnova_Grafiken/01_AppIcon_114x114px.png',

    models: [].concat(
    		['Answer', 'Config', 'Feedback', 'LoggedIn', 'Question', 'Session', 'Statistic', 'Course'],
    		['Auth', 'FeedbackQuestion']),
    
    views: [].concat(
    		
    		/* app/view */
    		['Caption', 'ExpandingAnswerForm', 'LoginPanel', 'MainTabPanel', 'TabPanel', 'RolePanel', 'MathJaxField'], 
    		['MathJaxMessageBox', 'MultiBadgeButton', 'MatrixButton', 'NumericKeypad', 'FreetextAnswerPanel', 'FreetextDetailAnswer'],
    		['FreetextQuestion', 'Question', 'QuestionStatusButton', 'SessionStatusButton', 'CustomMask', 'TextCheckfield'],
    		
    		/* app/view/about */
    		['about.InfoPanel'],
    		['about.StatisticPanel'],
    		['about.TabPanel'],
    		
    		/* app/view/feedback */
    		['feedback.AskPanel', 'feedback.StatisticPanel', 'feedback.TabPanel', 'feedback.VotePanel'],
    		
    		/* app/view/feedbackQuestions */
    		['feedbackQuestions.DetailsPanel', 'feedbackQuestions.QuestionsPanel', 'feedbackQuestions.TabPanel'],
    		
    		/* app/view/home */  
    		['home.HomePanel', 'home.MySessionsPanel', 'home.NewSessionPanel', 'home.TabPanel'],
    		
    		/* app/view/speaker */
    		['speaker.AudienceQuestionPanel', 'speaker.InClass', 'speaker.NewQuestionPanel', 'speaker.QuestionDetailsPanel'],
    		['speaker.QuestionStatisticChart', 'speaker.ShowcaseQuestionPanel', 'speaker.TabPanel'],
    		
    		/* app/view/user */
    		['user.InClass', 'user.QuestionPanel', 'user.TabPanel']),
	
    controllers: ['Auth', 'Feedback', 'Lang', 'Questions', 'Sessions', 'User'],
    
    /* items */
    mainTabPanel: null,
    tabPanel	: null,
    loginPanel	: null,
    loadingMask : null,
    taskManager	: null,
    previousActiveItem: null,
    
    /* infos */
    loginMode		: null,  /* ARSnova.app.LOGIN_GUEST, ... */
    appStatus		: null,	 /* ARSnova.app.WEBAPP || ARSnova.app.NATIVE */
    isSessionOwner	: false, /* boolean */
    loggedIn		: false, /* boolean */
    userRole		: null,  /* ARSnova.app.USER_ROLE_STUDENT || ARSnova.app.USER_ROLE_SPEAKER */
    isNative		: function () { return this.appStatus === this.NATIVE; },
    isWebApp		: function () { return this.appStatus === this.WEBAPP; },
    
    /* models */
    answerModel 	: null,
    feedbackModel	: null,
    loggedInModel	: null,
    questionModel	: null,
    sessionModel 	: null,
    statisticModel 	: null,
    courseModel     : null,
    
    /* proxy */
	restProxy		: null,
	
    /* other*/
    cardSwitchDuration: 500,
    socket: null,
    
    /* tasks */
	/**
	 * update every x seconds the user timestamp
	 * important for all "who is online"-requests
	 */
	loggedInTask: {
		name: 'save that user is logged in',
		run: function() {
			if (localStorage.getItem('keyword')) {
				ARSnova.app.restProxy.loggedInTask();
			}
		},
		interval: 60000 //60 seconds
	},
	
	/**
	 * update every x seconds the owner of a session is logged in
	 */
	updateSessionActivityTask: {
		name: 'save that owner of a session is logged in',
		run: function(){
			ARSnova.app.restProxy.updateSessionActivityTask();
		},
		interval: 180000 //180 seconds
	},
	
    /**
     * initialize models
     */
    initModels: function() {
    	this.answerModel 		= Ext.create('ARSnova.model.Answer');
    	this.authModel			= Ext.create('ARSnova.model.Auth');
    	this.feedbackModel		= Ext.create('ARSnova.model.Feedback');
    	this.loggedInModel		= Ext.create('ARSnova.model.LoggedIn');
    	this.questionModel		= Ext.create('ARSnova.model.Question');
    	this.sessionModel		= Ext.create('ARSnova.model.Session');
    	this.statisticModel 	= Ext.create('ARSnova.model.Statistic');
    	this.courseModel		= Ext.create('ARSnova.model.Course');
    },
    
    /**
     * This is called automatically when the page loads. Here we set up the main component on the page
     */
    launch: function(){
    	// Use native application update depending on manifest file changes on startup
		/*var appCache = window.applicationCache;
		if (appCache.status !== appCache.UNCACHED) {
			appCache.update();
		}*/
		
		window.addEventListener('load', function(e) {
			window.applicationCache.addEventListener('updateready', function(e) {
				if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
					// New version of ARSnova detected, swap in new chache
					window.applicationCache.swapCache();
					Ext.Msg.confirm(Messages.NEW_VERSION_TITLE, Messages.NEW_VERSION_AVAILABLE, function(answer) {
						if (answer == 'yes') {
							window.location.reload();
						}
					});
				}
			}, false);
		}, false);
		
		this.checkLocalStorage();
		if (!this.checkBrowser()) {
			alert("Für eine korrekte Darstellung von ARSnova benutzen Sie bitte einen WebKit-Browser, z.B. Apple Safari oder Google Chrome!");
			return;
		}
		
		taskManager = new Ext.util.TaskRunner();
		
		this.initSocket();
		this.initModels();
		this.restProxy = Ext.create('ARSnova.proxy.RestProxy'); 
		this.mainTabPanel = Ext.create('ARSnova.view.MainTabPanel');
		
		if (localStorage.getItem("ARSnovaCon") !== "true") {
			this.checkPreviousLogin();
		}
	},
	
	initSocket: function() {
		this.socket = Ext.create('ARSnova.WebSocket');
	},
	
	/**
	 * after user has logged in
	 * start some tasks and show the correct homepage to user
	 */
	afterLogin: function(){
		taskManager.start(ARSnova.app.loggedInTask);
		
		ARSnova.app.mainTabPanel.tabPanel.animateActiveItem(ARSnova.app.mainTabPanel.tabPanel.homeTabPanel, 'slide');
		var hTP = ARSnova.app.mainTabPanel.tabPanel.homeTabPanel;
		switch (ARSnova.app.userRole) {
			case ARSnova.app.USER_ROLE_STUDENT:
				hTP.homePanel.checkLogin();
				hTP.setActiveItem(hTP.homePanel);
				break;
			case ARSnova.app.USER_ROLE_SPEAKER:
				hTP.setActiveItem(hTP.mySessionsPanel);
				break;
			default:
				break;
		}
		
		if (localStorage.getItem("keyword") !== null && localStorage.getItem("keyword") !== "") {
			return ARSnova.app.getController('Sessions').login({
				keyword: localStorage.getItem("keyword")
			});
		}
    },
    
    /**
     * returns true if user is logged in a session
     */
    checkSessionLogin: function(){
    	if(localStorage.getItem('sessionId') == undefined || localStorage.getItem('sessionId') == "")
    		return false;
    	else
    		return true;
    },
	
	checkPreviousLogin: function(){
		var isLocalStorageUninitialized = localStorage.getItem('role') == null
									   || localStorage.getItem('loginMode') == null
									   || localStorage.getItem('login') == null;
		if (isLocalStorageUninitialized) return false;
		
		ARSnova.app.loggedIn = true;
		ARSnova.app.loginMode = localStorage.getItem('loginMode');
		ARSnova.app.userRole = localStorage.getItem('role');
		ARSnova.app.setWindowTitle();
		ARSnova.app.afterLogin();
	},

    setWindowTitle: function(){
		switch (ARSnova.app.userRole) {
			case ARSnova.app.USER_ROLE_SPEAKER:
				window.document.title = "ARSnova: Dozent/in";
				break;
			case ARSnova.app.USER_ROLE_STUDENT:
				window.document.title = "ARSnova: Zuhörer/in";
				break;
			default:
				window.document.title = "ARSnova";
				break;
		}
    },
    
    /**
     * Wrapper for an invidivudal LoadMask
     */
    showLoadMask: function(message){
    	this.loadingMask = new Ext.LoadMask({
    		message: message || ""
    	});
    	Ext.Viewport.add(this.loadingMask);
    	this.loadingMask.show();
    	setTimeout("ARSnova.app.hideLoadMask()", 5000); // hide this mask after 5 seconds automatically
    },
    
    /**
     * Wrapper for an invidivudal LoadMask
     */
    hideLoadMask: function(){
    	if(this.loadingMask){
    		clearTimeout("ARSnova.app.hideLoadMask()", 5000);
    		this.loadingMask.hide();
	    	this.loadingMask.destroy();
    	}
    },
    
    /**
     * clear local storage
     */
    cleanLocalStorage: function(){
    	localStorage.clear();
    },
    
    /**
     * check if string is valid json
     */
    isJsonString: function(str){
        try {
            JSON.parse(str);
        } catch (e){
            return false;
        }
        return true;
    },
	
	/**
	 * make localStorage ready 
	 */
	checkLocalStorage: function(){
		if (localStorage.getItem('lastVisitedSessions') == null){
			localStorage.setItem('lastVisitedSessions', "[]");
		}
		
		if (localStorage.getItem('questionIds') == null){
			localStorage.setItem('questionIds', "[]");
		}
		
		if (localStorage.getItem('loggedIn') == null){
			localStorage.setItem('loggedIn', "[]");
		}
		
		if (localStorage.getItem('user has voted')) {
			localStorage.removeItem('user has voted');
		}
		
		if (localStorage.getItem('session')) {
			localStorage.removeItem('session');
		}
		
		localStorage.setItem('sessionId', "");
		return true;
	},
	
	checkBrowser: function() {
		var detect = Ext.create('ARSnova.BrowserDetect');
		console.log(detect);
		if (detect.browser === "Firefox" && detect.version < 22) {
			return false;
		}
		if (detect.browser === "Opera" && detect.version < 15) {
			return false;
		}
		if (detect.browser === "Explorer" && detect.version < 10) {
			return false;
		}
		return true;
	},

    formatSessionID: function(sessionID){
		var tmp = [];
		for(var i = 0; i < sessionID.length; i++){
			if(i % 2){
				tmp.push(sessionID.substr(i - 1, 2));
			}
		}
		if(tmp.length * 2 < sessionID.length) tmp.push(sessionID[tmp.length * 2]);
		return tmp.join(" ");
	},
	
	removeVisitedSession: function(sessionId){
		var sessions = Ext.decode(localStorage.getItem('lastVisitedSessions'));
		for ( var i = 0; i < sessions.length; i++){
			var session = sessions[i];
			if (sessionId == session._id){
				sessions.splice(i, 1);
			}
		}
		localStorage.setItem('lastVisitedSessions', Ext.encode(sessions));
	}
});

function clone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0; i < obj.length; ++i) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
};
