import './App.css';

import { useState, useEffect } from 'react' 
import Cookies from 'js-cookie';

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, QuerySnapshot } from "firebase/firestore";

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
  console.log("new check", users, cookie)
  if (!cookie) {
    return false
  }
  if (users) {
    let found = false
    users.forEach(user => {
      console.log("checking", user.data().account.password, cookie)
      if (cookie === user.data().account.password) {
        found = found || true
        console.log("found it!")
      }
    })
    return found
  } else {
    return false
  }
}

function checkUsername(users,cookie) {
  console.log("new check for username", users, cookie)
  if (!cookie) {
    return "No username found"
  }
  if (users) {
    let found = "No username found"
    users.forEach(user => {
      console.log("checking", user.data().account.password, cookie)
      if (cookie === user.data().account.password) {
        found = user.data().account.username;
        console.log("found a username!")
      }
    })
    return found
  } else {
    return "No username found"
  }
}

function addGroup(username, data) {
  try {
    setDoc(doc(db, "users", username, "groups", data.name), data);
  } catch (error) {
    console.error("writing document failed:", error);
  }
}

function addSubject(username, groupname, data) {
  try {
    setDoc(doc(db, "users", username, "groups", groupname, "subjects", data.name), data);
  } catch (error) {
    console.error("writing document failed:", error);
  }
}

function addModule(username, groupname, subjectname, data) {
  try {
    setDoc(doc(db, "users", username, "groups", groupname, "subjects", subjectname, "modules", data.name), data);
  } catch (error) {
    console.error("writing document failed:", error);
  }
}

function addSystem(username, data) {
  try {
    setDoc(doc(db, "users", username, "systems", data.name), data);
  } catch (error) {
    console.error("writing document failed:", error);
  }
}

function getKey(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}


function Body(props) {
  const [users, setUsers] = useState(props.users)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [loggedIn, setLoggedIn] = useState(checkLoggedIn(users, Cookies.get("loggedIn")))
  const [signingUp, setSigningUp] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [grouplist, setGrouplist] = useState([]);

  async function fetchData() {
    try {
      const usersCollection = await getDocs(collection(db, "users"))
      setUsers(usersCollection)
      setLoading(false);
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData()
    console.log(users)
  }, [errorMessage])

  function logIn() {
    setErrorMessage("")
    fetchData()

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
    if (givenUsername == "") {
      setErrorMessage("Fields cannot be empty.")
    }
    if (givenPassword == "") {
      setErrorMessage("Fields cannot be empty.")
    }
  }

  function logOut() {
    Cookies.set("loggedIn", "", { expires: 365 })
    setLoggedIn(checkLoggedIn(users, Cookies.get("loggedIn")))
  }

  function signUp() {
    setErrorMessage("")
    fetchData()

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
      let exception = false
      try {
        setDoc(doc(db, "users", givenUsername), {
          account: {
            username: givenUsername,
            password: sha256(givenUsername + givenPassword),
            profile_image: "https://i.pinimg.com/custom_covers/222x/85498161615209203_1636332751.jpg"
          },
          tiers: ["not ready", "ready"]
        })
        addGroup(givenUsername, {
          name: "sample group",
          description: "sample description",
          system: "MSG"
        });
        addSubject(givenUsername, "sample group", {
          name: "sample subject",
          weightage: 1
        });
        addModule(givenUsername, "sample group", "sample subject", {
          name: "sample name",
          tier: 0,
          weightage: 1,
          records: {
            "1702651632011": 0
          }
        });
        addSystem(givenUsername, {
          name: "MSG", bands: {
            A1: "(i) => {return i >= 75}", 
            A2: "(i) => {return i >= 70 && i < 75}", 
            B3: "(i) => {return i >= 65 && i < 70}", 
            B4: "(i) => {return i >= 60 && i < 65}", 
            C5: "(i) => {return i >= 55 && i < 60}", 
            C6: "(i) => {return i >= 50 && i < 55}", 
            D7: "(i) => {return i >= 45 && i < 50}", 
            E8: "(i) => {return i >= 40 && i < 45}", 
            F9: "(i) => {return i < 40}"
          }
        });
        addSystem(givenUsername, {
          name: "GPA 1", bands: {
            "A+": "(i) => {return i >= 80}", 
            A: "(i) => {return i >= 70 && i < 80}", 
            "B+": "(i) => {return i >= 65 && i < 70}", 
            B: "(i) => {return i >= 60 && i < 65}", 
            "C+": "(i) => {return i >= 55 && i < 60}",
            C: "(i) => {return i >= 50 && i < 55}",
            D: "(i) => {return i >= 45 && i < 50}",
            E: "(i) => {return i >= 40 && i < 45}",
            F: "(i) => {return i < 40}"
          }
        });
        addSystem(givenUsername, {
          name: "GPA 2", bands: {
            "A+": "(i) => {return i >= 85}",
            A: "(i) => {return i >= 70 && i < 85}",
            "B+": "(i) => {return i >= 65 && i < 70}",
            B: "(i) => {return i >= 60 && i < 65}",
            "C+": "(i) => {return i >= 55 && i < 60}",
            C: "(i) => {return i >= 50 && i < 55}",
            "C-": "(i) => {return i >= 45 && i < 50}",
            "D+": "(i) => {return i >= 40 && i < 45}",
            D: "(i) => {return i >= 35 && i < 40}",
            E: "(i) => {return i >= 20 && i < 35}",
            U: "(i) => {return i < 20}"
          }
        });
      } catch (error) {
        console.error("writing document failed:", error);
        exception = error
      } 
      if (!exception) {
        Cookies.set("loggedIn", sha256(givenUsername + givenPassword), { expires: 365 })
        fetchData()
        setLoggedIn(checkLoggedIn(users, Cookies.get("loggedIn")))
      } else {
        deleteDoc(doc(db, "users", givenUsername))
        console.log("attempted to delete document")
      }
    }
    if (givenUsername == "") {
      setErrorMessage("Fields cannot be empty.")
    }
    if (givenPassword == "") {
      setErrorMessage("Fields cannot be empty.")
    }
  }

  useEffect(() => {
    setLoggedIn(checkLoggedIn(users, Cookies.get("loggedIn")));
    switch (props.tab) {
      case 1:
        let groups;
        let cookie = Cookies.get("loggedIn");
        users.forEach(user => {
          if (cookie === user.data().account.password) {
            groups = user.data().groups;
          }
        })
        setGrouplist([]);
        getDocs(groups).then(QuerySnapshot => {
          QuerySnapshot.forEach((doc) => {
            console.log("doc.data", doc.data());
            setGrouplist(grouplist+(doc.data().name));
          })
        })
    }
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
            <div id="subjectlist">
              {grouplist}
            </div>
          </div>
        )
      case 2:
        return (
          <div className="body">
            here are all your stats!
          </div>
        )
      case 3:
        console.log("loggedIn", loggedIn)
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
      try {
        const usersCollection = await getDocs(collection(db, "users"))
        setUsers(usersCollection)
        setLoading(false);
      } catch (error) {
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
