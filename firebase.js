const firebaseConfig = window.__FIREBASE_CONFIG__ || null;

(function(){
  if(!firebaseConfig){
    console.warn('firebase.js: No firebaseConfig found.');
    return;
  }

  try{ firebase.initializeApp(firebaseConfig); } catch(e){ console.warn('firebase.js: init failed', e); }

  window.fetchSetlistFromFirebase = function(){
    try{
      const db = firebase.database();
      return db.ref('/setlist').get().then(s => s.exists() ? s.val() : Promise.reject('no-data'));
    }catch(e){ return Promise.reject(e); }
  };

  window.writeSetlistToFirebase = function(value){
    try{
      const db = firebase.database();
      const ref = db.ref('/setlist');
      return ref.set(value).then(()=> value);
    }catch(e){
      return Promise.reject(e);
    }
  };
})();