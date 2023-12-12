import './App.css';

import { useState, useEffect } from 'react' 
import Cookies from 'js-cookie';

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

function checkLoggedIn(users, cookie) {
  console.log("checking", users, cookie)
  if (!cookie) {
    return false
  }
  if (users) {
    let found = false
    users.forEach(user => {
      console.log(user.data().account.password, cookie)
      if (cookie === user.data().account.password) {
        console.log("found cookie")
        found = found || true
      }
    })
    return found
  } else {
    return false
  }
}

function Body(props) {
  const users = props.users
  const [loggedIn, setLoggedIn] = useState(checkLoggedIn(users, Cookies.get("loggedIn")))
  const [signingUp, setSigningUp] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  function logIn() {
    const givenUsername = document.getElementById('username-input').value
    const givenPassword = document.getElementById('password-input').value
    let found = false
    users.forEach((user) => {
      if (user.data().account.username === givenUsername) {
        found = true
        if (user.data().account.password === sha256(givenUsername + givenPassword)) {
          Cookies.set("loggedIn", sha256(givenUsername + givenPassword), { expires: 365 })
          setLoggedIn(checkLoggedIn(users, Cookies.get("loggedIn")))
        } else {
          setErrorMessage("wrong password.")
        }
      }
    })
    if (!found) {
      setErrorMessage("invalid username.")
    }
  }

  function logOut() {
    Cookies.set("loggedIn", "", { expires: 365 })
    setLoggedIn(checkLoggedIn(users, Cookies.get("loggedIn")))
  }

  function signUp() {
    const givenUsername = document.getElementById('username-input').value
    const givenPassword = document.getElementById('password-input').value
    const confirmPassword = document.getElementById('password-input-confirm').value
    let found = false
    users.forEach((user) => {
      if (user.data().account.username === givenUsername) {
        found = true
      }
    })
    if (found) {
      setErrorMessage("username already taken.")
      return
    }
    if (givenPassword !== confirmPassword) {
      setErrorMessage("passwords do not match.")
    } else {
      try {
        db.collection("users").doc(givenUsername).set({
          account: {
            username: givenUsername,
            password: givenPassword,
            profile_image: "https://i.pinimg.com/custom_covers/222x/85498161615209203_1636332751.jpg"
          },
          tiers: ["bad", "good"]
        })
        // sample group
        // sample subject
        // sample module
        // sample systems (gpa and msg)
        // sample bands
      } catch (error) {
        console.error("writing document failed:", error);
      }
    }
  }

  useEffect(() => {
    setLoggedIn(checkLoggedIn(users, Cookies.get("loggedIn")))
  }, [users])

  if (props.error) {
    return ("lmfao error")
  } else if (props.loading) {
    return (
      <div className="body"> 
        loading...
      </div>
    )
  } else if (!loggedIn && props.tab !== 3) {
    return (
      <div className="body">
        um... i think you should probably log in or sign up first
      </div>
    )
  } else {
    switch (props.tab) {
      case 0:
        return (
          <div className="body">
            welcome home! :3
          </div>
        )
      case 1:
        return (
          <div className="body">
            here are all the subjects!
          </div>
        )
      case 2:
        return (
          <div className="body">
            here are all your stats!
          </div>
        )
      case 3:
        if (!loggedIn) {
          if (!props.loading) {
            if (!signingUp) {
              return (
                <div className="body">
                  <p>
                    username: <input type="text" id="username-input" />
                  </p>
                  <p>
                    password: <input type="text" id="password-input" />
                  </p>
                  <button className="button" id="login-submit-button" onClick={logIn}>submit</button>
                  <p style={{color: "red"}}>{errorMessage}</p>
                  <p>if you don't have an account yet, sign up <a onClick={() => setSigningUp(true)}>here</a>.</p>
                </div>
              )
            } else {
              return (
                <div className="body">
                  <p>
                    username: <input type="text" id="username-input" />
                  </p>
                  <p>
                    password: <input type="text" id="password-input" />
                  </p>
                  <p>
                    confirm password: <input type="text" id="password-input-confirm" />
                  </p>
                  <button className="button" id="login-submit-button" onClick={signUp}>submit</button>
                  <p style={{color: "red"}}>{errorMessage}</p>
                  <p>if you already have an account, log in <a onClick={() => setSigningUp(false)}>here</a>.</p>
                </div>
              )
            }
          } else {
            return ("hold on its loading")
          }
        } else {
          return (
            <div className="body">
              <button onClick={() => logOut()}>log out</button>
            </div>
          )  
        }
      default:
        return (checkLoggedIn(users, Cookies.get("loggedIn")) ? "youre logged in yay!" : "uhh yeah um")
    }
  }
}

function App() {
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
        <button className="header-children" onClick={() => setTab(0)}>logo</button>
        <button className="header-children" onClick={() => setTab(1)}>subjects</button> 
        <button className="header-children" onClick={() => setTab(2)}>stats</button> 
      </div>
      <div className="header right">
        <button className="header-children" onClick={() => setTab(3)}>{checkLoggedIn(users, Cookies.get("loggedIn")) ? "account" : "log in / sign up"}</button>
      </div>
    </div>
  )

  return (
    <div className="App">
      <script src="https://www.gstatic.com/firebasejs/10.6.0/firebase-app-compat.js"></script>
      <script src="https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore-compat.js"></script>
      {navbar}
      <Body tab={tab} users={users} loading={loading} error={error} />
    </div>
  );
}

export default App;
