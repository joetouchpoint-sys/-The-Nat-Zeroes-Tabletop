/* Firebase real-time sync for Nat Zeroes VTT
   Exposes window.NZFirebase — used by battlemap.jsx for live session sharing */
(function() {
  var firebaseConfig = {
    apiKey: "AIzaSyAc4OJVMZ3ZvM_HmLfvMw9JWEeu9UDHOA8",
    authDomain: "nat-zeroes.firebaseapp.com",
    databaseURL: "https://nat-zeroes-default-rtdb.firebaseio.com",
    projectId: "nat-zeroes",
    storageBucket: "nat-zeroes.firebasestorage.app",
    messagingSenderId: "92379774362",
    appId: "1:92379774362:web:011719f653613e66090e23"
  };

  try {
    firebase.initializeApp(firebaseConfig);
    var db = firebase.database();

    var currentRef = null;
    var currentListener = null;
    var isIncoming = false;
    var writeTimer = null;

    window.NZFirebase = {
      joinRoom: function(code, onUpdate) {
        // Leave existing room
        if (currentRef && currentListener) currentRef.off("value", currentListener);
        currentRef = db.ref("rooms/" + code);
        currentListener = currentRef.on("value", function(snap) {
          var data = snap.val();
          if (!data) return;
          isIncoming = true;
          try { onUpdate(data); } catch(e) {}
          setTimeout(function() { isIncoming = false; }, 200);
        });
      },
      leaveRoom: function() {
        if (currentRef && currentListener) { currentRef.off("value", currentListener); }
        currentRef = null; currentListener = null;
      },
      push: function(data) {
        if (!currentRef || isIncoming) return;
        clearTimeout(writeTimer);
        writeTimer = setTimeout(function() {
          if (currentRef) currentRef.set(data).catch(function() {});
        }, 180);
      },
      isReady: true
    };
  } catch(e) {
    console.warn("Firebase init failed:", e.message);
    window.NZFirebase = { joinRoom: function(){}, leaveRoom: function(){}, push: function(){}, isReady: false };
  }
})();
