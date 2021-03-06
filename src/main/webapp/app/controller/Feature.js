/*
 * This file is part of ARSnova Mobile.
 * Copyright (C) 2011-2012 Christian Thomas Weber
 * Copyright (C) 2012-2015 The ARSnova Team
 *
 * ARSnova Mobile is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * ARSnova Mobile is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with ARSnova Mobile.  If not, see <http://www.gnu.org/licenses/>.
 */
Ext.define("ARSnova.controller.Feature", {
	extend: 'Ext.app.Controller',

	useCases: {
		custom: true,
		total: false,
		clicker: false,
		liveFeedback: false,
		flashcard: false,
		peerGrading: false
	},

	features: {
		pi: true,
		jitt: true,
		lecture: true,
		feedback: true,
		interposed: true,
		learningProgress: true
	},

	applyFeatures: function () {
		var features = Ext.decode(sessionStorage.getItem("features"));

		var useCases = {
			clicker: this.applyClickerUseCase,
			peerGrading: this.applyPeerGradingUseCase,
			flashcard: this.applyFlashcardUseCase,
			liveFeedback: this.applyLiveFeedbackUseCase,
			total: this.applyTotalUseCase,
			custom: this.applyCustomUseCase
		};

		for (var property in features) {
			if (features[property] && typeof useCases[property] === 'function') {
				useCases[property].call(this, features);
			}
		}
	},

	applyClickerUseCase: function (useCases) {
		this.applyCustomUseCase(useCases, this.getFeatureValues(useCases));
	},

	applyPeerGradingUseCase: function (useCases) {
		this.applyCustomUseCase(useCases, this.getFeatureValues(useCases));
	},

	applyFlashcardUseCase: function (useCases) {
		this.applyCustomUseCase(useCases, this.getFeatureValues(useCases));
	},

	applyLiveFeedbackUseCase: function (useCases) {
		this.applyCustomUseCase(useCases, this.getFeatureValues(useCases));
	},

	applyTotalUseCase: function (useCases) {
		this.applyCustomUseCase(useCases, this.features);
	},

	applyCustomUseCase: function (useCases, features) {
		features = features || Ext.decode(sessionStorage.getItem("features"));

		var functions = {
			pi: this.applyPiFeature,
			jitt: this.applyJittFeature,
			lecture: this.applyLectureFeature,
			feedback: this.applyFeedbackFeature,
			interposed: this.applyInterposedFeature,
			learningProgress: this.applyLearningProgressFeature
		};

		for (var property in features) {
			if (typeof functions[property] === 'function') {
				functions[property].call(this, features[property]);
			}
		}

		if (features && Object.keys(features).length) {
			this.applyAdditionalChanges(features);
		}
	},

	getFeatureValues: function (useCases) {
		var features = Ext.Object.merge({}, this.features, useCases);

		if (useCases.clicker) {
			features.jitt = false;
			features.learningProgress = false;
			features.interposed = false;
			features.feedback = false;
		}

		if (useCases.peerGrading) {
			features.interposed = false;
			features.feedback = false;
			features.jitt = false;
		}

		if (useCases.flashcard) {
			features.jitt = false;
			features.learningProgress = false;
			features.interposed = false;
			features.learningProgress = false;
			features.feedback = false;
			features.pi = false;
		}

		if (useCases.liveFeedback) {
			features.pi = false;
			features.jitt = false;
			features.lecture = false;
			features.learningProgress = false;
		}

		return features;
	},

	/**
	 * apply changes affecting the "lecture" feature
	 */
	applyLectureFeature: function (enable) {
		var tP = ARSnova.app.mainTabPanel.tabPanel;
		var tabPanel, container, button, position;

		if (ARSnova.app.userRole === ARSnova.app.USER_ROLE_SPEAKER) {
			tabPanel = tP.speakerTabPanel;
			position = 1;
		} else {
			tabPanel = tP.userTabPanel;
			position = 0;
		}

		container = tabPanel.inClassPanel.inClassButtons;
		button = tabPanel.inClassPanel.lectureQuestionButton;
		this.applyButtonChange(container, button, enable, position);
	},

	/**
	 * apply changes affecting the "jitt" feature
	 */
	applyJittFeature: function (enable) {
		var tP = ARSnova.app.mainTabPanel.tabPanel;
		var tabPanel, container, button, position;

		if (ARSnova.app.userRole === ARSnova.app.USER_ROLE_SPEAKER) {
			tabPanel = tP.speakerTabPanel;
			position = 2;
		} else {
			tabPanel = tP.userTabPanel;
			position = 1;
		}

		container = tabPanel.inClassPanel.inClassButtons;
		button = tabPanel.inClassPanel.preparationQuestionButton;
		this.applyButtonChange(container, button, enable, position);
	},

	/**
	 * apply changes affecting the "feedback" feature
	 */
	applyFeedbackFeature: function (enable) {
		var tP = ARSnova.app.mainTabPanel.tabPanel;
		tP.feedbackTabPanel.tab.setHidden(!enable);

		if (ARSnova.app.userRole !== ARSnova.app.USER_ROLE_SPEAKER) {
			var inClassPanel = tP.userTabPanel.inClassPanel;
			var container = inClassPanel.actionButtonPanel;
			this.applyButtonChange(container, inClassPanel.voteButton, enable, 5);
		}
	},

	/**
	 * apply changes affecting the "interposed" feature
	 */
	applyInterposedFeature: function (enable) {
		var tP = ARSnova.app.mainTabPanel.tabPanel;
		var tabPanel, container, button, position;

		if (ARSnova.app.userRole === ARSnova.app.USER_ROLE_SPEAKER) {
			tabPanel = tP.speakerTabPanel;
			container = tabPanel.inClassPanel.inClassButtons;
			button = tabPanel.inClassPanel.feedbackQuestionButton;
			tP.feedbackQuestionsPanel.tab.setHidden(!enable);
			position = 0;
		} else {
			tabPanel = tP.userTabPanel;
			container = tabPanel.inClassPanel.inClassButtons;
			button = tabPanel.inClassPanel.myQuestionsButton;
			tabPanel.inClassPanel.feedbackButton.setHidden(!enable);
			position = 2;
		}

		this.applyButtonChange(container, button, enable, position);
	},

	/**
	 * apply changes affecting the "learningProgress" feature
	 */
	applyLearningProgressFeature: function (enable) {
		var tP = ARSnova.app.mainTabPanel.tabPanel;
		var tabPanel, container, button;

		if (ARSnova.app.userRole === ARSnova.app.USER_ROLE_SPEAKER) {
			tabPanel = tP.speakerTabPanel;
			container = tabPanel.inClassPanel.inClassButtons;
			button = tabPanel.inClassPanel.courseLearningProgressButton;
		} else {
			tabPanel = tP.userTabPanel;
			container = tabPanel.inClassPanel.inClassButtons;
			button = tabPanel.inClassPanel.myLearningProgressButton;
		}

		ARSnova.app.globalConfig.features.learningProgress = enable;
		this.applyButtonChange(container, button, enable, 3);
	},

	/**
	 * return key of lone active option
	 */
	getLoneActiveFeatureKey: function (features) {
		var loneActiveFeature = false;
		for (var key in features) {
			if (!this.useCases.hasOwnProperty(key) && key !== 'pi') {
				if (loneActiveFeature && features[key]) {
					return false;
				} else if (features[key] && key !== 'learningProgress') {
					loneActiveFeature = key;
				}
			}
		}

		return loneActiveFeature;
	},

	/**
	 * apply changes affecting combined feature activation/deactivation
	 */
	applyAdditionalChanges: function (features) {
		var hasQuestionFeatures = features.lecture || features.jitt;
		var feedbackWithoutInterposed = features.feedback && !features.interposed;
		var isSpeaker = ARSnova.app.userRole === ARSnova.app.USER_ROLE_SPEAKER;
		var loneActiveFeature = this.getLoneActiveFeatureKey(features);

		var tP = ARSnova.app.mainTabPanel.tabPanel;
		var tabPanel = isSpeaker ? tP.speakerTabPanel : tP.userTabPanel;

		if (isSpeaker) {
			tabPanel.inClassPanel.showcaseActionButton.setHidden(!hasQuestionFeatures);
			tabPanel.inClassPanel.createAdHocQuestionButton.setHidden(!hasQuestionFeatures);
			tabPanel.inClassPanel.updateActionButtonElements();

			if (features.jitt && !features.lecture) {
				tabPanel.inClassPanel.changeActionButtonsMode('preparation');
				tabPanel.showcaseQuestionPanel.setController(ARSnova.app.getController('PreparationQuestions'));
				tabPanel.showcaseQuestionPanel.setPreparationMode();
				tabPanel.newQuestionPanel.setVariant('preparation');
			} else {
				tabPanel.inClassPanel.changeActionButtonsMode('lecture');
				tabPanel.showcaseQuestionPanel.setController(ARSnova.app.getController('Questions'));
				tabPanel.showcaseQuestionPanel.setLectureMode();
				tabPanel.newQuestionPanel.setVariant('lecture');
			}
		} else {
			// hide questionsPanel tab when session has no question features active
			tP.userQuestionsPanel.tab.setHidden(!hasQuestionFeatures);

			// hide question request button if interposed feature is disabled
			tP.feedbackTabPanel.votePanel.questionRequestButton.setHidden(feedbackWithoutInterposed);

			if (features.jitt && !features.lecture) {
				tP.userQuestionsPanel.setPreparationMode();
				tabPanel.inClassPanel.updateQuestionsPanelBadge();
				tP.userQuestionsPanel.tab.setTitle(Messages.TASKS);
			} else {
				tP.userQuestionsPanel.setLectureMode();
				tabPanel.inClassPanel.updateQuestionsPanelBadge();
				tP.userQuestionsPanel.tab.setTitle(Messages.QUESTIONS);
			}

			// flashcard use case
			tabPanel.inClassPanel.lectureQuestionButton.setText(
				features.flashcard ? Messages.FLASHCARDS : Messages.LECTURE_QUESTION_LONG
			);

			// peer grading use case
			if (tabPanel.inClassPanel.myLearningProgressButton) {
				tabPanel.inClassPanel.myLearningProgressButton.setText(
					features.peerGrading ? Messages.EVALUATION_LONG : Messages.MY_LEARNING_PROGRESS
				);
			}

			if (localStorage.getItem('lastVisitedRole') !== ARSnova.app.USER_ROLE_SPEAKER) {
				this.setSinglePageMode(loneActiveFeature.toString(), features);
			}
		}

		if (features.learningProgress) {
			var hideQuestionVariantField = false;
			var sessionController = ARSnova.app.getController('Sessions');
			var progressOptions = Object.create(sessionController.getLearningProgressOptions());
			var questionVariant = progressOptions.questionVariant;

			if (!features.lecture || !features.jitt) {
				hideQuestionVariantField = true;
				if (questionVariant !== 'preparation' && !features.lecture) {
					progressOptions.questionVariant = 'preparation';
				} else if (questionVariant !== 'lecture' && !features.jitt) {
					progressOptions.questionVariant = 'lecture';
				}
			}

			// set learningProgessOption after learningProgressOptions socket has been send
			var changeLearningProgressOptions = function changeOptions() {
				if (ARSnova.app.sessionModel.isLearningProgessOptionsInitialized) {
					Ext.create('Ext.util.DelayedTask', function () {
						sessionController.setLearningProgressOptions(progressOptions);
						tabPanel.learningProgressPanel.refreshQuestionVariantFields();
					}).delay(500);
				} else {
					Ext.create('Ext.util.DelayedTask', changeOptions).delay(100);
				}
			};

			tabPanel.learningProgressPanel.setQuestionVariantFieldHidden(hideQuestionVariantField);
			changeLearningProgressOptions();
		}
	},

	setSinglePageMode: function (featureKey, features) {
		var tP = ARSnova.app.mainTabPanel.tabPanel;
		var tabPanel = tP.userTabPanel;

		if (features[featureKey]) {
			tabPanel.inClassPanel.stopTasks();
			tabPanel.tab.hide();
		}

		switch (featureKey) {
			case 'jitt':
			case 'lecture':
				if (tP.getActiveItem() === tP.userQuestionsPanel) {
					tP.userQuestionsPanel.removeAll();
					tP.userQuestionsPanel.getUnansweredSkillQuestions();
				}
				tP.userQuestionsPanel.setSinglePageMode(true, this);
				tP.setActiveItem(tP.userQuestionsPanel);
				break;
			case 'feedback':
				tP.feedbackTabPanel.votePanel.setSinglePageMode(true, this);
				tP.setActiveItem(tP.feedbackTabPanel);
				break;
			default:
			case 'interposed':
				tP.setActiveItem(tabPanel);
				ARSnova.app.socket.setSession(null);
				ARSnova.app.socket.setSession(sessionStorage.getItem('keyword'));
				ARSnova.app.sessionModel.fireEvent(ARSnova.app.sessionModel.events.sessionJoinAsStudent);
				tP.feedbackTabPanel.votePanel.setSinglePageMode(false, this);
				tP.userQuestionsPanel.setSinglePageMode(false, this);
				tabPanel.inClassPanel.startTasks();
				tabPanel.tab.show();
		}
	},

	/**
	 * removes or adds button from given container
	 */
	applyButtonChange: function (container, button, addButton, index) {
		if (!container || !button) {
			return;
		}

		if (typeof addButton !== 'boolean') {
			addButton = false;
		}

		if (addButton) {
			container.insert(index, button);
		} else {
			container.remove(button, false);
		}
	},

	applyNewQuestionPanelChanges: function (panel) {
		var indexMap = panel.getOptionIndexMap();
		var features = Ext.decode(sessionStorage.getItem("features"));

		if (features.flashcard) {
			panel.questionOptions.setPressedButtons([indexMap[Messages.FLASHCARD]]);
			panel.optionsToolbar.setHidden(true);
		} else if (features.peerGrading) {
			panel.questionOptions.setPressedButtons([indexMap[Messages.EVALUATION]]);
			panel.optionsToolbar.setHidden(true);
		} else if (features.clicker) {
			var options = panel.questionOptions.getInnerItems();
			options[indexMap[Messages.FREETEXT]].hide();
			options[indexMap[Messages.FLASHCARD]].hide();
			options[indexMap[Messages.GRID]].hide();
		} else {
			panel.optionsToolbar.setHidden(false);
			panel.questionOptions.config.showAllOptions();
		}
	}
});
