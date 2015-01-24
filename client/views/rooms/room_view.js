Template.roomView.helpers({
    room: function () {
        return Rooms.findOne({_id: Session.get('currentRoom')});
    },
    currentRooms: function () {
        return Rooms.find({users: Meteor.userId()});
    },
    currentRoom: function () {
        return Session.get('currentRoom');
    },
    availableRooms: function () {
        return Rooms.find();
    },
    messageLimit: function(){
        return Session.get('messageLimit');
    }
});
Template.roomView.events({
    'click #loadMore': function (e) {
        Session.set('messageLimit', Session.get('messageLimit') + 20);
        e.preventDefault();
    },
    'scroll #roomContainer':function(e){
        var room = $("#roomContainer");
        if(room.scrollTop() < 50 && !scroll.needScroll && isReady.messages){
            scroll.needScroll = true;
            scroll.previousHeight = $("#scrollContainer").height();
            incMessageLimit(5);
        }
    },
    'click #editUserProfile': function(e) {
        var options = {};
        options.data = function() { return Meteor.user().profile; };
        AntiModals.overlay("user", options);
    }
});

Template.roomView.rendered = function () {
    Meteor.call('setSeen', Session.get('currentRoom'));
};

var isReady = {};
var scroll = {};
Template.roomView.created = function () {
    isReady.notifications = false;
    isReady.messages = false;

    Session.setDefault('messageLimit', 10);
    Deps.autorun(function () {
        isReady.messages = false;
        Meteor.subscribe('messages', Session.get('currentRoom'), Session.get('messageLimit'),{
            onReady:function(){
                isReady.messages = true;
                if(scroll.needScroll){
                    var room = $("#roomContainer");
                    scroll.needScroll = false;
                    var offset = $("#scrollContainer").height() - scroll.previousHeight;
                    room.scrollTop(room.scrollTop()+offset);
                }
                else{
                    scrollChatToBottom();
                }
            }
        });
        Meteor.subscribe('feedbackMessages', Session.get('currentRoom'));
    });

    var clickSound = new buzz.sound('/sounds/click_04.wav');
    var chimeSound = new buzz.sound('/sounds/chime_bell_ding.wav');

    Notifications.find().observe({
        added: function(document){
            if(isReady.notifications) {
                chimeSound.play();
                var permission = notify.permissionLevel();
                if(permission === notify.PERMISSION_DEFAULT) {
                    notify.requestPermission();
                }
                if(permission === notify.PERMISSION_GRANTED)
                {
                    var title = document.authorName+"(#"+document.roomName+")";
                    var user = Meteor.users.findOne({_id:document.authorId},{fields:{"profile.avatar":1}});
                    var avatar = user && user.profile && user.profile.avatar || '/images/logo64.png';
                    notify.createNotification(title,{body:document.message,icon:avatar});
                }
            }
        }
    });
    Messages.find().observe({
        added: function(doc) {
            if(isReady.messages && doc && doc.type !=='feedback' && doc.authorId !== Meteor.userId()) {
                clickSound.play();

                if(!document.hasFocus()) {
                    var currentUnreadMessageCount = Session.get('unreadMessages');
                    currentUnreadMessageCount += 1;
                    Session.set('unreadMessages', currentUnreadMessageCount);
                }
                if(doc.roomId !== Session.get('currentRoom')){
                    incRoomUnread(doc.roomId);
                }
            }
            if(!scroll.needScroll){
                scrollChatToBottom();
            }
        }
    });

    Session.set('unreadMessages', 0);
    Deps.autorun(function() {
        var numberOfUnreadMessages = Session.get('unreadMessages');
        var currentRoom = Rooms.findOne({_id: Session.get('currentRoom')});

        var currentRoomString = '';

        if(currentRoom) {
            currentRoomString = '#' + currentRoom.name + ' ';
        }

        if(numberOfUnreadMessages > 0) {
            document.title = "(" + numberOfUnreadMessages + ")" + " " + currentRoomString + window.location.hostname;
        } else {
            document.title = currentRoomString + window.location.hostname;
        }
    });

    Meteor.subscribe('newMessages');
    isReady.notifications = true;
};
Template.roomView.destroyed = function(){
    isReady.notifications = false;
    isReady.messages = false;
}