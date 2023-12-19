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

async function fetchData(params, func, setLoading, setError) {
  try {
    const ncollection = await getDocs(collection(db, "users/" + params.join("/")))
    let modifiedCollection = []
    ncollection.forEach((docu) => {
      modifiedCollection.push(docu.data())
    })
    console.log(params, func, modifiedCollection)
    func(modifiedCollection)
    setLoading(false);
  } catch (error) {
    setError(error);
    console.error(error)
    setLoading(false);
  }
}

function checkLoggedIn(users, cookie) {
  if (!cookie) {
    return false
  }
  try {
    JSON.parse(cookie)
  } catch {
    return false
  }
  if (users) {
    let found = false
    users.forEach(user => {
      if (JSON.parse(cookie).password === user.account.password) {
        found = found || true
      }
    })
    return found
  } else {
    return false
  }
}

function checkUsername(users,cookie) {
  if (!cookie) {
    return "No username found"
  }
  try {
    JSON.parse(cookie)
  } catch {
    return false
  }
  if (users) {
    let found = "No username found"
    users.forEach(user => {
      if (JSON.parse(cookie).password === user.account.password) {
        found = user.account.username;
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
  const [groups, setGroups] = useState([])

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [loggedIn, setLoggedIn] = useState(checkLoggedIn(users, Cookies.get("loggedIn")))
  const [signingUp, setSigningUp] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [grouplist, setGrouplist] = useState([]);

  useEffect(() => {
    setLoggedIn(checkLoggedIn(users, Cookies.get("loggedIn")))

    fetchData([], setUsers, setLoading, setError)
    try {
      let username = JSON.parse(Cookies.get("loggedIn")).username
      if (checkLoggedIn(users, Cookies.get("loggedIn")) && props.tab === 1) {
        fetchData([username, "groups"], setGroups, setLoading, setError)
      }
    } catch {}
  }, [errorMessage, users])

  function logIn() {
    setErrorMessage("")
    fetchData([], setUsers, setLoading, setError)

    const givenUsername = document.getElementById('username-input').value
    const givenPassword = document.getElementById('password-input').value
    
    let found = false
    users.forEach((user) => {
      if (user.account.username === givenUsername) {
        found = true
        if (user.account.password === sha256(givenUsername + givenPassword)) {
          Cookies.set("loggedIn", JSON.stringify({username: givenUsername, password: sha256(givenUsername + givenPassword)}), { expires: 365 })
          setLoggedIn(checkLoggedIn(users, Cookies.get("loggedIn")))
        } else {
          setErrorMessage("wrong password.")
        }
      }
    })
    if (!found) {
      setErrorMessage("invalid username.")
    }
    if (givenUsername === null) {
      setErrorMessage("Fields cannot be empty.")
    }
    if (givenPassword === null) {
      setErrorMessage("Fields cannot be empty.")
    }
  }

  function logOut() {
    Cookies.set("loggedIn", "", { expires: 365 })
    setLoggedIn(checkLoggedIn(users, Cookies.get("loggedIn")))
  }

  function signUp() {
    setErrorMessage("")
    fetchData([], setUsers, setLoading, setError)

    const givenUsername = document.getElementById('username-input').value
    const givenPassword = document.getElementById('password-input').value
    const confirmPassword = document.getElementById('password-input-confirm').value
    let found = false
    users.forEach((user) => {
      if (user.account.username === givenUsername) {
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
        })
        addGroup(givenUsername, {
          name: "sample group",
          description: "sample description",
          system: "MSG"
        });
        addSubject(givenUsername, "sample group", {
          name: "sample subject",
          weightage: 1,
          colour: "#ffffff"
        });
        addModule(givenUsername, "sample group", "sample subject", {
          name: "sample name",
          weightage: 1,
          records: {
            "1702651632011": 0
          }
        });
        addSystem(givenUsername, {
          name: "MSG", bands: {
            A1: {
              condition: "(i) => {return i >= 75}", 
              colour: "#ff0000",
            },
            A2: {
              condition: "(i) => {return i >= 70 && i < 75}", 
              colour: "#ffaa00"
            },
            B3: {
              condition: "(i) => {return i >= 65 && i < 70}", 
              colour: "#aaff00"
            },
            B4: {
              condition: "(i) => {return i >= 60 && i < 65}", 
              colour: "#00ff00"
            }, 
            C5: {
              condition: "(i) => {return i >= 55 && i < 60}", 
              colour: "#00ffaa"
            }, 
            C6: {
              condition: "(i) => {return i >= 50 && i < 55}", 
              colour: "#00aaff"
            }, 
            D7: {
              condition: "(i) => {return i >= 45 && i < 50}", 
              colour: "#0000ff"
            }, 
            E8: {
              condition: "(i) => {return i >= 40 && i < 45}", 
              colour: "#aa00ff"
            }, 
            F9: {
              condition: "(i) => {return i < 40}", 
              colour: "#ff00aa"
            }
          }
        });
        addSystem(givenUsername, {
          name: "GPA 1", bands: {
            "A+": {
              condition: "(i) => {return i >= 80}", 
              colour: "#a65bf5"
            },
            A: {
              condition: "(i) => {return i >= 70 && i < 80}", 
              colour: "#a53ef4"
            },
            "B+": {
              condition: "(i) => {return i >= 65 && i < 70}", 
              colour: "#a921f2"
            },
            B: {
              condition: "(i) => {return i >= 60 && i < 65}", 
              colour: "#ad0de7"
            },
            "C+": {
              condition: "(i) => {return i >= 55 && i < 60}", 
              colour: "#a65bf5"
            },
            C: {
              condition: "(i) => {return i >= 50 && i < 55}", 
              colour: "#a70cca"
            },
            D: {
              condition: "(i) => {return i >= 45 && i < 50}", 
              colour: "#9d0aae"
            },
            E: {
              condition: "(i) => {return i >= 40 && i < 45}", 
              colour: "#8e0891"
            },
            F: {
              condition: "(i) => {return i < 40}", 
              colour: "#74076c"
            }
          }
        });
        addSystem(givenUsername, {
          name: "GPA 2", bands: {
            "A+": {
              condition: "(i) => {return i >= 85}", 
              colour: "#2bf3d1"
            },
            A: {
              condition: "(i) => {return i >= 70 && i < 85}", 
              colour: "#19e6d8"
            },
            "B+": {
              condition: "(i) => {return i >= 65 && i < 70}", 
              colour: "#21bbc0"
            },
            B: {
              condition: "(i) => {return i >= 60 && i < 65}", 
              colour: "#258d9d"
            },
            "C+": {
              condition: "(i) => {return i >= 55 && i < 60}", 
              colour: "#26697d"
            },
            C: {
              condition: "(i) => {return i >= 50 && i < 55}", 
              colour: "#254c5f"
            },
            "C-": {
              condition: "(i) => {return i >= 45 && i < 50}", 
              colour: "#213545"
            },
            "D+": {
              condition: "(i) => {return i >= 40 && i < 45}", 
              colour: "#1a232d"
            },
            D: {
              condition: "(i) => {return i >= 35 && i < 40}", 
              colour: "#1a212d"
            },
            E: {
              condition: "(i) => {return i >= 20 && i < 35}", 
              colour: "#1a1f2d"
            },
            U: {
              condition: "(i) => {return i < 20}", 
              colour: "#1a1e2d"
            }
          }
        });
        addSystem(givenUsername, {
          name: "yesAndNo", bands: {
            "Yes": {
              condition: "(i) => {return i == 100}", 
              colour: "#00ff33"
            },
            "No": {
              condition: "(i) => {return i == 0}", 
              colour: "#ff0000"
            }
          }
        })
      } catch (error) {
        console.error("writing document failed:", error);
        exception = error
      } 
      if (!exception) {
        Cookies.set("loggedIn", JSON.stringify({username: givenUsername, password: sha256(givenUsername + givenPassword)}), { expires: 365 })
        fetchData([], setUsers, setLoading, setError)
        setLoggedIn(checkLoggedIn(users, Cookies.get("loggedIn")))
      } else {
        deleteDoc(doc(db, "users", givenUsername))
      }
    }
    if (givenUsername === null) {
      setErrorMessage("Fields cannot be empty.")
    }
    if (givenPassword === null) {
      setErrorMessage("Fields cannot be empty.")
    }
  }

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
            here are all the groups!
            <div id="subjectlist">
              {
                groups.map((group) => { 
                  console.log(group)
                  return <div className="group">{group.name}</div>
                })
              }
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
    fetchData([], setUsers, setLoading, setError)
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
