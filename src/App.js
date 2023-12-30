import './App.css';

import { useState, useEffect } from 'react' 
import Cookies from 'js-cookie';

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";

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

async function fetchData(params, func, setLoading, setError, loading) {
  try {
    const ncollection = await getDocs(collection(db, "users/" + params.join("/")))
    let modifiedCollection = []
    ncollection.forEach((docu) => {
      modifiedCollection.push(docu.data())
    })
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

function checkUsername(users, cookie) {
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

function editGroup(username, data, update=false) {
  console.log("editing group", data)
  try {
    setDoc(doc(db, "users", username, "groups", data.id), data)
  } catch (error) {
    console.error("writing document failed:", error);
  }
}

function editSubject(username, groupname, data) {
  try {
    setDoc(doc(db, "users", username, "groups", groupname, "subjects", data.id), data);
  } catch (error) {
    console.error("writing document failed:", error);
  }
}

function editModule(username, groupname, subjectname, data) {
  try {
    setDoc(doc(db, "users", username, "groups", groupname, "subjects", subjectname, "modules", data.id), data);
  } catch (error) {
    console.error("writing document failed:", error);
  }
}

function editSystem(username, data) {
  try {
    setDoc(doc(db, "users", username, "systems", data.id), data);
  } catch (error) {
    console.error("writing document failed:", error);
  }
}

function getKey(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

function Dropdown(props) {
  const [chosen, setChosen] = useState(props.list[0])
  return (
    <div className="dropdown">
      <button className="dropbtn" id={props.id+"-chosen"}>{chosen}</button>
      <div className="dropdown-content">
        {
          props.list.map(system => {
            return <button onClick={() => setChosen(system)}>{system}</button>
          })
        }
      </div>
    </div>
  )
}

function SubjectsBody(props) {
  const [color, setColor] = useState(Math.floor(Math.random()*16777215).toString(16))
  const [error, setError] = useState("")

  const [color2, setColor2] = useState(Math.floor(Math.random()*16777215).toString(16))
  const [error2, setError2] = useState("")
  
  if (props.chosenGroup.name === "settings") {
    return (
      <div className="subjects-body">
        <div className="add-group">
          add group:
          <div>
            name: <input type="text" id="form-addgroup-name-input" />
          </div>
          <div>
            description: <input type="text" id="form-addgroup-description-input" />
          </div>
          <div style={{color: color}}>
            color: <input type="text" id="form-addgroup-color-input" onChange={e => setColor(e.target.value)}/>
          </div>
          <div>
            system: <Dropdown id="form-addgroup-system-list" list={props.systems.map(prop => prop.name)}/>
          </div>
          <span style={{color: "#f00"}}>{error}</span>
          <button id="form-addgroup-submit-button" onClick={
            () => {
              let newGroup = {
                id: sha256(document.getElementById("form-addgroup-name-input").value),
                name: document.getElementById("form-addgroup-name-input").value,
                description: document.getElementById("form-addgroup-description-input").value,
                color: document.getElementById("form-addgroup-color-input").value,
                system: document.getElementById("form-addgroup-system-list-chosen").value
              }
              setError("")
              for (let group in props.groupList) {
                if (props.groupList[group].name === newGroup.name) {
                  setError(`group with name "${newGroup.name}" already exists.`)
                } 
              }
              if (!error) {
                editGroup(sha256(props.username), newGroup)
              }
            }
          }>add group</button>
        </div>
      </div>
    )
  } else if (props.chosenSubject.name === "settings") {
    return (
      <div className="subjects-body">
        <div className="edit-group">
          edit group:
          <div>
            name: <input type="text" id="form-editgroup-name-input" />
          </div>
          <div>
            description: <input type="text" id="form-editgroup-description-input" />
          </div>
          <div style={{color: color}}>
            color: <input type="text" id="form-editgroup-color-input" onChange={e => setColor(e.target.value)}/>
          </div>
          <div>
            system: <Dropdown id="form-editgroup-system-list" list={props.systems.map(prop => prop.name)}/>
          </div>
          <span style={{color: "#f00"}}>{error}</span>
          <button id="form-editgroup-submit-button" onClick={
            () => {
              let newGroup = {
                id: props.chosenGroup.id,
                name: document.getElementById("form-editgroup-name-input").value,
                description: document.getElementById("form-editgroup-description-input").value,
                color: document.getElementById("form-editgroup-color-input").value,
                system: document.getElementById("form-editgroup-system-list-chosen").value
              }
              setError("")
              for (let group in props.groupList) {
                if (props.groupList[group].name === newGroup.name && props.groupList[group].id != newGroup.id) {
                  setError(`group with name "${newGroup.name}" already exists.`)
                } 
              }
              if (!error) {
                editGroup(sha256(props.username), newGroup, true)
                console.log(props.groupList)
              }
            }
          }>edit group</button>
        </div>
        <div className="add-subject">
          add subject:
          <div>
            name: <input type="text" id="form-addsubject-name-input" />
          </div>
          <div>
            weightage: <input type="text" id="form-addsubject-weightage-input" />
          </div>
          <div style={{color: color2}}>
            color: <input type="text" id="form-addsubject-color-input" onChange={e => setColor2(e.target.value)}/>
          </div>
          <button id="form-addsubject-submit-button" onClick={
            () => {
              let newSubject = {
                id: sha256(document.getElementById("form-addsubject-name-input").value),
                name: document.getElementById("form-addsubject-name-input").value,
                weightage: Number(document.getElementById("form-addsubject-weightage-input").value),
                color: document.getElementById("form-addsubject-color-input").value,
              }
              setError("")
              for (let subject in props.subjectList) {
                if (props.subjectList[subject].name === newSubject.name) {
                  setError(`group with name "${newSubject.name}" already exists.`)
                } 
              }
              if (!error) {
                editSubject(sha256(props.username), sha256(props.chosenGroup.name), newSubject)
              }
            }
          }>add subject</button>
        </div>
      </div>
    )
  } else if (props.chosenModule.name === "settings") {
    return (
      <div className="subjects-body">
        <div className="edit-subject">
          edit subject:
          <div>
            name: <input type="text" id="form-editsubject-name-input" />
          </div>
          <div>
            weightage: <input type="text" id="form-editsubject-weightage-input" />
          </div>
          <div style={{color: color}}>
            color: <input type="text" id="form-editsubject-color-input" onChange={e => setColor(e.target.value)}/>
          </div>
          <button id="form-editsubject-submit-button" onClick={
            () => {
              let newSubject = {
                id: props.chosenSubject.id,
                name: document.getElementById("form-editsubject-name-input").value,
                weightage: Number(document.getElementById("form-editsubject-weightage-input").value),
                color: document.getElementById("form-editsubject-color-input").value,
              }
              setError("")
              for (let subject in props.subjectList) {
                if (props.subjectList[subject].name === newSubject.name && props.subjectList[subject].id != newSubject.id) {
                  setError(`group with name "${newSubject.name}" already exists.`)
                } 
              }
              if (!error) {
                editSubject(sha256(props.username), sha256(props.chosenGroup.name), newSubject)
              }
            }
          }>edit subject</button>
        </div>
        <div className="add-module">
          add module:
          <div>
            name: <input type="text" id="form-addmodule-name-input" />
          </div>
          <div>
            weightage: <input type="text" id="form-addmodule-weightage-input" />
          </div>
          <div style={{color: color2}}>
            color: <input type="text" id="form-addmodule-color-input" onChange={e => setColor2(e.target.value)}/>
          </div>
          <button id="form-addmodule-submit-button" onClick={
            () => {
              let newModule = {
                id: sha256(document.getElementById("form-addmodule-name-input").value),
                name: document.getElementById("form-addmodule-name-input").value,
                weightage: Number(document.getElementById("form-addmodule-weightage-input").value),
                color: document.getElementById("form-addmodule-color-input").value,
              }
              setError("")
              for (let modul in props.moduleList) {
                if (props.moduleList[modul].name === newModule.name) {
                  setError(`group with name "${newModule.name}" already exists.`)
                } 
              }
              if (!error) {
                editModule(sha256(props.username), sha256(props.chosenGroup.name), sha256(props.chosenSubject.name), newModule)
              }
            }
          }>add module</button>
        </div>
      </div>
    )
  } else if (props.chosenGroup.name && props.chosenSubject.name && props.chosenModule.name) {
    return (
      <div className="subjects-body">
        <div className="edit-module">
          edit module:
          <div>
            name: <input type="text" id="form-editmodule-name-input" />
          </div>
          <div>
            weightage: <input type="text" id="form-editmodule-weightage-input" />
          </div>
          <div style={{color: color}}>
            color: <input type="text" id="form-editmodule-color-input" onChange={e => setColor(e.target.value)}/> 
          </div>
          <button id="form-editmodule-submit-button" onClick={
            () => {
              let newModule = {
                id: props.chosenModule.id,
                name: document.getElementById("form-editmodule-name-input").value,
                weightage: Number(document.getElementById("form-editmodule-weightage-input").value),
                color: document.getElementById("form-editmodule-color-input").value,
              }
              setError("")
              for (let modul in props.moduleList) {
                if (props.moduleList[modul].name === newModule.name && props.moduleList[modul].id != newModule.id) {
                  setError(`group with name "${newModule.name}" already exists.`)
                } 
              }
              if (!error) {
                editGroup(sha256(props.username), sha256(props.chosenGroup.name), sha256(props.chosenSubject.name), newModule)
              }
            }
          }>edit module</button>
        </div>
      </div>
    )
  }
}

function Body(props) {
  const [users, setUsers] = useState(props.users)

  const [error, setError] = useState(null);

  const [loggedIn, setLoggedIn] = useState(checkLoggedIn(users, Cookies.get("loggedIn")))
  const [signingUp, setSigningUp] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const [groupList, setGroupList] = useState([]);
  const [subjectList, setSubjectList] = useState([]);
  const [moduleList, setModuleList] = useState([])

  const [chosenGroup, setChosenGroup] = useState({})
  const [chosenSubject, setChosenSubject] = useState({})
  const [chosenModule, setChosenModule] = useState({})

  const [systems, setSystems] = useState([])

  useEffect(() => {
    setLoggedIn(checkLoggedIn(users, Cookies.get("loggedIn")))

    fetchData([], setUsers, props.setLoading, setError)
    try {
      let username = JSON.parse(Cookies.get("loggedIn")).username
      if (checkLoggedIn(users, Cookies.get("loggedIn"))) {
        fetchData([sha256(username), "groups"], setGroupList, props.setLoading, setError)
        fetchData([sha256(username), "systems"], setSystems, props.setLoading, setError)
      }
    } catch {}

  }, [props.tab, loggedIn, errorMessage])

  useEffect(() => {
    try {
      let username = JSON.parse(Cookies.get("loggedIn")).username
      if (checkLoggedIn(users, Cookies.get("loggedIn")) && props.tab === 1) {
        if (Object.keys(chosenGroup).length) {
          fetchData([sha256(username), "groups", sha256(chosenGroup.name), "subjects"], setSubjectList, props.setLoadingGroups, setError, props.loadingGroups)
        }
        if (Object.keys(chosenSubject).length) {
          fetchData([sha256(username), "groups", sha256(chosenGroup.name), "subjects", sha256(chosenSubject.name), "modules"], setModuleList, props.setLoadingGroups, setError, props.loadingGroups)
        }
      }
    } catch {}
  }, [props.tab, loggedIn, chosenGroup, chosenSubject])

  function logIn() {
    setErrorMessage("")
    fetchData([], setUsers, props.setLoading, setError)

    const givenUsername = document.getElementById('form-login-username-input').value
    const givenPassword = document.getElementById('form-login-password-input').value
    
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
    fetchData([], setUsers, props.setLoading, setError)

    const givenUsername = document.getElementById('form-login-username-input').value
    const givenPassword = document.getElementById('form-login-password-input').value
    const confirmPassword = document.getElementById('form-login-password-input-confirm').value
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
        setDoc(doc(db, "users", sha256(givenUsername)), {
          account: {
            id: sha256(givenUsername),
            username: givenUsername,
            password: sha256(givenUsername + givenPassword),
            profile_image: "https://i.pinimg.com/custom_covers/222x/85498161615209203_1636332751.jpg"
          },
        })
        editGroup(sha256(givenUsername), {
          id: sha256("sample group"),
          name: "sample group",
          description: "sample description",
          color: "#ffffff",
          system: "MSG"
        });
        editSubject(sha256(givenUsername), sha256("sample group"), {
          id: sha256("sample subject"),
          name: "sample subject",
          weightage: 1,
          color: "#ffffff"
        });
        editModule(sha256(givenUsername), sha256("sample group"), sha256("sample subject"), {
          id: sha256("sample module"),
          name: "sample module",
          tier: 0,
          weightage: 1,
          color: "#ffffff",
          records: {
            "1702651632011": 0
          }
        });
        editSystem(sha256(givenUsername), {
          id: sha256("MSG"),
          name: "MSG", 
          bands: {
            A1: {
              condition: "(i) => {return i >= 75}", 
              color: "#ff0000",
            },
            A2: {
              condition: "(i) => {return i >= 70 && i < 75}", 
              color: "#ffaa00"
            },
            B3: {
              condition: "(i) => {return i >= 65 && i < 70}", 
              color: "#aaff00"
            },
            B4: {
              condition: "(i) => {return i >= 60 && i < 65}", 
              color: "#00ff00"
            }, 
            C5: {
              condition: "(i) => {return i >= 55 && i < 60}", 
              color: "#00ffaa"
            }, 
            C6: {
              condition: "(i) => {return i >= 50 && i < 55}", 
              color: "#00aaff"
            }, 
            D7: {
              condition: "(i) => {return i >= 45 && i < 50}", 
              color: "#0000ff"
            }, 
            E8: {
              condition: "(i) => {return i >= 40 && i < 45}", 
              color: "#aa00ff"
            }, 
            F9: {
              condition: "(i) => {return i < 40}", 
              color: "#ff00aa"
            }
          }
        });
        editSystem(sha256(givenUsername), {
          id: sha256("GPA 1"),
          name: "GPA 1", 
          bands: {
            "A+": {
              condition: "(i) => {return i >= 80}", 
              color: "#a65bf5"
            },
            A: {
              condition: "(i) => {return i >= 70 && i < 80}", 
              color: "#a53ef4"
            },
            "B+": {
              condition: "(i) => {return i >= 65 && i < 70}", 
              color: "#a921f2"
            },
            B: {
              condition: "(i) => {return i >= 60 && i < 65}", 
              color: "#ad0de7"
            },
            "C+": {
              condition: "(i) => {return i >= 55 && i < 60}", 
              color: "#a65bf5"
            },
            C: {
              condition: "(i) => {return i >= 50 && i < 55}", 
              color: "#a70cca"
            },
            D: {
              condition: "(i) => {return i >= 45 && i < 50}", 
              color: "#9d0aae"
            },
            E: {
              condition: "(i) => {return i >= 40 && i < 45}", 
              color: "#8e0891"
            },
            F: {
              condition: "(i) => {return i < 40}", 
              color: "#74076c"
            }
          }
        });
        editSystem(sha256(givenUsername), {
          id: sha256("GPA 2"),
          name: "GPA 2", 
          bands: {
            "A+": {
              condition: "(i) => {return i >= 85}", 
              color: "#2bf3d1"
            },
            A: {
              condition: "(i) => {return i >= 70 && i < 85}", 
              color: "#19e6d8"
            },
            "B+": {
              condition: "(i) => {return i >= 65 && i < 70}", 
              color: "#21bbc0"
            },
            B: {
              condition: "(i) => {return i >= 60 && i < 65}", 
              color: "#258d9d"
            },
            "C+": {
              condition: "(i) => {return i >= 55 && i < 60}", 
              color: "#26697d"
            },
            C: {
              condition: "(i) => {return i >= 50 && i < 55}", 
              color: "#254c5f"
            },
            "C-": {
              condition: "(i) => {return i >= 45 && i < 50}", 
              color: "#213545"
            },
            "D+": {
              condition: "(i) => {return i >= 40 && i < 45}", 
              color: "#1a232d"
            },
            D: {
              condition: "(i) => {return i >= 35 && i < 40}", 
              color: "#1a212d"
            },
            E: {
              condition: "(i) => {return i >= 20 && i < 35}", 
              color: "#1a1f2d"
            },
            U: {
              condition: "(i) => {return i < 20}", 
              color: "#1a1e2d"
            }
          }
        });
        editSystem(sha256(givenUsername), {
          id: sha256("yes and no"),
          name: "yes and no", 
          bands: {
            "yes": {
              condition: "(i) => {return i == 100}", 
              color: "#00ff33"
            },
            "no": {
              condition: "(i) => {return i == 0}", 
              color: "#ff0000"
            }
          }
        })
      } catch (error) {
        console.error("writing document failed:", error);
        exception = error
      } 
      if (!exception) {
        Cookies.set("loggedIn", JSON.stringify({username: givenUsername, password: sha256(givenUsername + givenPassword)}), { expires: 365 })
        fetchData([], setUsers, props.setLoading, setError)
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
    return (<div className='body'>{String(props.error)}</div>)
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
        if (props.loading) {
          return (
            <div className="body"> 
              loading...
            </div>
          )
        }
        return (
          <div className="body">
            <div className="side-panel groups">
              {
                groupList.map((group) => {
                  return <button className={`side-panel-item ${chosenGroup === group ? "selected" : ""}`} style={{color: group.color}} onClick={() => {setChosenGroup(group); setChosenSubject({}); setChosenModule({})}}>{group.name}</button>
                })
              }
              <button className={`side-panel-item ${chosenGroup === "settings" ? "selected" : ""}`} onClick={() => {setChosenGroup({name: "settings"}); setChosenSubject({}); setChosenModule({})}}>overall settings</button>
            </div>
            {
              chosenGroup.name === "settings" ? <div></div> : !Object.keys(chosenGroup).length ? "pick a group first!" : !subjectList ? "add a subject!" :<div className="side-panel subjects">
                { 
                  subjectList.map((subject) => { 
                    return <button className={`side-panel-item ${chosenSubject === subject ? "selected" : ""}`} style={{color: subject.color}} onClick={() => {setChosenSubject(subject); setChosenModule({})}}>{subject.name}</button>
                  })
                }
                <button className={`side-panel-item ${chosenSubject === "settings" ? "selected" : ""}`} onClick={() => {setChosenSubject({name: "settings"}); setChosenModule({})}}>group settings</button>
              </div>
            }
            {
              chosenGroup.name === "settings" || chosenSubject.name === "settings" ? <div></div> : !Object.keys(chosenSubject).length ? (Object.keys(chosenGroup).length ? "pick a subject first!" : "") : !moduleList ? "add a module!" : <div className="side-panel modules">
                {
                  moduleList.map((module) => { 
                    return <button className={`side-panel-item ${chosenModule === module ? "selected" : ""}`} style={{color: module.color}} onClick={() => {setChosenModule(module)}}>{module.name}</button>
                  })
                }
                <button className={`side-panel-item ${chosenModule === "settings" ? "selected" : ""}`} onClick={() => {setChosenModule({name: "settings"})}}>subject settings</button>
              </div>
            }
            <SubjectsBody username={checkUsername(users, Cookies.get("loggedIn"))} groupList={groupList} setGroupList={setGroupList} subjectList={subjectList} setSubjectList={setSubjectList} moduleList={moduleList} setModuleList={setModuleList} chosenGroup={chosenGroup} chosenSubject={chosenSubject} chosenModule={chosenModule} systems={systems}/>
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
                  <div>
                    username: <input type="text" id="form-login-username-input" />
                  </div>
                  <div>
                    password: <input type="password" id="form-login-password-input" />
                  </div>
                  <button className="button" id="form-login-submit-button" onClick={logIn}>log in</button>
                  <div style={{color: "red"}}>{errorMessage}</div>
                  <div>if you don't have an account yet, sign up <a onClick={() => setSigningUp(true)}>here</a>.</div>
                </div>
              )
            } else {
              return (
                <div className="body">
                  <div>
                    username: <input type="text" id="form-login-username-input" />
                  </div>
                  <div>
                    password: <input type="password" id="form-login-password-input" />
                  </div>
                  <div>
                    confirm password: <input type="password" id="form-login-password-input-confirm" />
                  </div>
                  <button className="button" id="form-login-submit-button" onClick={signUp}>sign up</button>
                  <div style={{color: "red"}}>{errorMessage}</div>
                  <div>if you already have an account, log in <a onClick={() => setSigningUp(false)}>here</a>.</div>
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
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData([], setUsers, setLoading, setError)
  }, [tab]); 

  const navbar = (
    <div className="navbar">
      <div className="header left">
        <button className="header-children" onClick={() => setTab(0)}>home</button>
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
      <Body tab={tab} users={users} loading={loading} setLoading={setLoading} loadingGroups={loadingGroups} setLoadingGroups={setLoadingGroups} error={error} />
    </div>
  );
}

export default App;
