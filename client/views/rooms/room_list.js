Template.roomList.rendered = function(){
    var roomList = Sortable.create(this.$(".room-list").get()[0],{
        group: "roomOrder",
        draggable: ".draggableRoomItem",
        ghostClass: "room-item-ghost",
        store:{
            get:function(sortable){
                var userPreferences = Meteor.user().preferences;
                return userPreferences && userPreferences.roomOrder ? userPreferences.roomOrder : [];
            },
            set:function(sortable){
                Meteor.call('updateRoomOrder',sortable.toArray());
            }
        },
        animation: 150,
        scroll: true,
        scrollSensitivity: 50,
        scrollSpeed:4
    });
};
Template.roomList.helpers({
    currentRooms: function () {
        return Rooms.find({users: Meteor.userId()});
    }
});