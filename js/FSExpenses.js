/**
 * Created by fokion on 14/04/17.
 */
function FSExpenses() {
  var me = this;
  me.categories = null;
  var DEFAULT_CATEGORIES = [
    {"value": "eating out", "data-color": "#8c4551", "label": "eating out"  },
    {"value": "going-out", "data-color": "#f3e395", "label": "going out" },
    {"value": "clothes", "data-color": "#48aaf3", "label": "clothes"},
    {"value": "vacation", "data-color": "#9a58f3", "label": "vacation"},
    {"value": "coffee", "data-color": "#da645a", "label": "coffee"},
    {"value": "supermarket", "data-color": "#79a38f", "label": "supermarket"}

  ];
  me.init = function () {
    document.getElementById('sign-out').addEventListener('click',signOut,false);
    document.getElementById('quickstart-sign-in').addEventListener('click', toggleSignIn, false);
    document.getElementById('graph-btn').addEventListener('click',switchToCharts,false);
    document.getElementById('record-btn').addEventListener('click',switchToRecord,false);
    firebase.auth().getRedirectResult().then(function (result) {

      if (result.credential) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        me.gtoken = result.credential.accessToken;
      }
      // The signed-in user info.
      me.user = result.user;
    });
    firebase.auth().onAuthStateChanged(function (user) {
      classie.remove(document.getElementById("account-controls"), 'hidden');
      classie.add(document.getElementById("loading"), 'hidden');
      if (user) {
        classie.add(document.getElementById("login-container"), 'hidden');
        classie.remove(document.getElementById("form-container"), 'hidden');
        document.getElementById("account-name").textContent = user.displayName;
        var database = firebase.database();
        var userRef = database.ref("users/" + user.uid);
        userRef.once('value', function (snapshot) {
          if (!snapshot.val()) {
            userRef.set({
              "categories": DEFAULT_CATEGORIES
            });
          }
        });
        var categoriesRef = database.ref("users/" + user.uid + "/categories");
        categoriesRef.on('value', function (snapshot) {
          if(!snapshot.val()){
            categoriesRef.set(DEFAULT_CATEGORIES);
          }else {
            me.categories = snapshot.val();
          }
          updateCategoriesSelection();
        });
      } else {
        classie.remove(document.getElementById("login-container"), 'hidden');
        classie.add(document.getElementById("form-container"), 'hidden');
      }
    });
    function switchToCharts(){
      classie.add(document.getElementById("form-container"), 'hidden');
      classie.remove(document.getElementById("charts-container"), 'hidden');
      var database = firebase.database();
      var user = firebase.auth().currentUser;
      var expenses = database.ref("/users/"+user.uid+"/expenses");
      expenses.once('value').then(function(snapshot) {
          me.chart.onDataUpdated(snapshot.val());
          new Chart("overview", me.chart.getRandarDataSet());
      });
    }
    function switchToRecord(){
      classie.add(document.getElementById("charts-container"), 'hidden');
      classie.remove(document.getElementById("form-container"), 'hidden');
    }
    function updateCategoriesSelection() {
      me.chart.setDataTypes(me.categories);
      var selectElement = document.getElementById("category-selection");
      var length = selectElement.length;
      //clear old...
      for(var i = 0 ; i < length ; i++){
        selectElement.remove(1);
      }
      //add the new...
      for (var i = 0; i < me.categories.length; i++) {
        var categoryOption = me.categories[i];
        var option = document.createElement('option');
        option.value = categoryOption.value;
        option.text = categoryOption.label;
        option.setAttribute('data-color', categoryOption['data-color']);
        selectElement.add(option);
      }
      [].slice.call(document.querySelectorAll('select.cs-select')).forEach(function (el) {
        new SelectFx(el, {
          stickyPlaceholder: false,
          onChange: function (color) {
            document.querySelector('span.cs-placeholder').style.backgroundColor = color;
          }
        });
      });
    }

    function saveToFirebase() {
      var database = firebase.database();
      var userId = firebase.auth().currentUser.uid;
      var expensesRef = database.ref('users/' + userId + '/expenses');
      var newExpenseRef = expensesRef.push();
      var state = me.form.getCurrentState();
      state["timestamp"] = firebase.database.ServerValue.TIMESTAMP;
      newExpenseRef.set(state);
    }

    var formWrap = document.getElementById('fs-form-wrap');

    me.chart = new ChartController();

    me.form = new FormController(formWrap, {
      onReview: saveToFirebase
    });

  };
  function signOut(){
    firebase.auth().signOut();
  }
  function toggleSignIn() {
    if (!firebase.auth().currentUser) {
      // [START createprovider]
      var provider = new firebase.auth.GoogleAuthProvider();
      // [END createprovider]
      // [START addscopes]
      provider.addScope('https://www.googleapis.com/auth/plus.login');
      // [END addscopes]
      // [START signin]
      firebase.auth().signInWithRedirect(provider);
      // [END signin]
    } else {
      // [START signout]
      firebase.auth().signOut();
      // [END signout]
    }
    // [START_EXCLUDE]
    document.getElementById('quickstart-sign-in').disabled = true;
    // [END_EXCLUDE]
  }
}

window.onload = function () {
  window.FSExpensesApp = new FSExpenses();
  window.FSExpensesApp.init();
}