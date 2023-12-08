import './App.css';

import { useState, useEffect } from 'react' 
import { useCookies } from 'react-cookie';

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from "firebase/firestore";

import { sha256 } from 'js-sha256';

const firebaseConfig = {
  apiKey: "AIzaSyDtM_T9fJt4miiDDYkkWJg3XynMwWBFBMg",
  authDomain: "study-8289d.firebaseapp.com",
  databaseURL: "https://study-8289d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "study-8289d",
  storageBucket: "study-8289d.appspot.com",
  messagingSenderId: "906722849841",
  appId: "1:906722849841:web:644725a219466d036a5110",
  measurementId: "G-43P6V2WZMS"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log(JSON.parse(localStorage.getItem("signin")))

function checkLoggedIn(users, cookie) {
  if (users) {
    console.log("checking logged in", users, cookie)
    users.forEach(user => {
      if (cookie === user.data().account.password) {
        return true
      }
    })
    return false
  } else {
    return false
  }
}

function Body(props) {
  const [cookies, setCookie, removeCookie] = useCookies();

  const users = props.users

  function logIn() {
    const givenUsername = document.getElementById('username-input').value
    const givenPassword = document.getElementById('password-input').value
    users.forEach((user) => {
      console.log(user.data())
      if (user.data().account.username === givenUsername) {
        console.log("found user")
        if (user.data().account.password === sha256(givenUsername + givenPassword)) {
          console.log("logged in")
          setCookie("loggedIn", sha256(givenUsername + givenPassword))
        }
      }
    })
  }

  if (props.error) {
    return ("lmfao error")
  } else if (!checkLoggedIn(users, cookies.loggedIn) && props.tab !== 3) {
    setCookie("loggedIn", "")
    return (
      <div className="body">
        {props.loading ? "loading..." : "um... i think you should probably log in or sign up first"}
      </div>
    )
  } else {
    switch (props.tab) {
      case 3:
        if (!checkLoggedIn(users, cookies.loggedIn)) {
          if (!props.loading) {
            return (
              <div>
                <p>
                  username: <input type="text" id="username-input" />
                </p>
                <p>
                  password: <input type="text" id="password-input" />
                </p>
                <button className="button" id="login-submit-button" onClick={logIn}>submit</button>
              </div>
            )
          } else {
            return ("hold on its loading")
          }
        } else {
          return ("so youre like logged in alr yay!!!")
        }
      default:
        return (checkLoggedIn(users, cookies.loggedIn) ? "youre logged in yay!" : "uhh yeah um")
    }
  }
}

function App() {
  const [cookies, setCookie, removeCookie] = useCookies();
  const [tab, setTab] = useState(0)

  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      console.log("entered fetchdata")
      try {
        console.log("trying to get data")
        const usersCollection = await getDocs(collection(db, "users"))
        console.log("data", usersCollection)
        setUsers(usersCollection)
        setLoading(false);
        console.log("data got")
      } catch (error) {
        console.log("didnt get the data", error)
        setError(error);
        setLoading(false);
      }
    }

    fetchData()
  }, [tab]); 

  const navbar = (
    <div className="navbar">
      <div className="header left">
        <button className="header-children">logo</button>
        <button className="header-children">subjects</button> 
        <button className="header-children">stats</button> 
      </div>
      <div className="header right">
        {checkLoggedIn(users, cookies.loggedIn) ? <button className="header-children">account</button> : <button className="header-children" onClick={() => {setTab(3); console.log("tab")}}>log in / sign up</button>}
      </div>
    </div>
  )

  return (
    <div className="App">
      <script src="https://www.gstatic.com/firebasejs/10.6.0/firebase-app-compat.js"></script>
      <script src="https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore-compat.js"></script>
      {navbar}
      <Body tab={tab} users={users} loading={loading} error={error}/>
    </div>
  );
}

export default App;
