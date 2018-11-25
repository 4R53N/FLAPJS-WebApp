class LocalSaveManager
{
  constructor()
  {
    this._handlers = new Set();
    this._intervalID = null;
    this._intervalMillis = 1000;

    this._init = false;

    this.onIntervalUpdate = this.onIntervalUpdate.bind(this);
  }

  setAutoSaveInterval(millis)
  {
    if (!millis || millis <= 0) throw new Error("AutoSave interval must be greater than 0");
    this._intervalMillis = millis;
  }

  registerHandler(handler)
  {
    if (this._handlers.has(handler))
    {
      throw new Error("Cannot register handler, since it is already registered");
    }
    this._handlers.add(handler);
  }

  unregisterHandler(handler)
  {
    if (!this._handlers.has(handler))
    {
      throw new Error("Cannot remove handler, since it is not yet registered");
    }
    this._handlers.delete(handler);
  }

  initialize()
  {
    if (this._init) throw new Error("Cannot initialize LocalSave, since it is already initialized");

    if (this.doesSupportLocalStorage())
    {
      //Prepare autosave
      this._intervalID = setInterval(this.onIntervalUpdate, this._intervalMillis);
      this._init = true;
    }
    else
    {
      //Does not support local storage, so ignore everything...
    }
  }

  terminate()
  {
    if (!this._init) throw new Error("Cannot terminate LocalSave, since it is not yet initialized");

    clearInterval(this._intervalID);

    this._handlers.clear();
    this._init = false;
  }

  onIntervalUpdate()
  {
    //Save most recent save for all registered handlers
    for(let handler of this._handlers)
    {
      try
      {
        handler.onAutoSave();
      }
      catch(e)
      {
        console.error(e);
      }
    }
  }

  setStringToStorage(saveKey, stringData)
  {
    if (!this.doesSupportLocalStorage()) return;
    if (stringData.length > 0)
    {
      localStorage.setItem(saveKey, stringData);
    }
    else
    {
      localStorage.removeItem(saveKey);
    }
  }

  getStringFromStorage(saveKey)
  {
    if (!this.doesSupportLocalStorage()) return "";
    return localStorage.getItem(saveKey) || "";
  }

  loadFromStorage(saveKey)
  {
    if (!this.doesSupportLocalStorage()) return {};
    const item = JSON.parse(localStorage.getItem(saveKey));
    return item ? item : null;
  }

  saveToStorage(saveKey, jsonData)
  {
    if (!this.doesSupportLocalStorage()) return;

    let hidden, visibilityChange;

    // Opera 12.10 and Firefox 18 and later support
    if (typeof document.hidden !== "undefined")
    {
      hidden = "hidden";
      visibilityChange = "visibilitychange";
    }
    else if (typeof document.msHidden !== "undefined")
    {
      hidden = "msHidden";
      visibilityChange = "msvisibilitychange";
    }
    else if (typeof document.webkitHidden !== "undefined")
    {
      hidden = "webkitHidden";
      visibilityChange = "webkitvisibilitychange";
    }

    if (document[hidden])
    {
      //Don't save anything...
      return;
    }

    if (typeof jsonData == 'object')
    {
      let flag = jsonData;
      if (flag)
      {
        flag = false;

        //Don't save empty objects, cause that is wasteful.
        for(let key in jsonData)
        {
          if (jsonData.hasOwnProperty(key))
          {
            flag = true;
            break;
          }
        }
      }

      //Save or remove the data...
      if (flag)
      {
        localStorage.setItem(saveKey, JSON.stringify(jsonData));
      }
      else
      {
        localStorage.removeItem(saveKey);
      }
    }
    else if (typeof jsonData == 'string')
    {
      const flag = jsonData.length <= 0;

      //Save or remove the data...
      if (flag)
      {
        localStorage.setItem(saveKey, jsonData);
      }
      else
      {
        localStorage.removeItem(saveKey);
      }
    }
  }

  existsInStorage(saveKey)
  {
    if (!this.doesSupportLocalStorage()) return false;
    return localStorage.getItem(saveKey) != null;
  }

  clearStorage()
  {
    if (!this.doesSupportLocalStorage()) return;

    localStorage.clear();
  }

  doesSupportLocalStorage()
  {
    //check if browser support local storage
    return typeof Storage !== 'undefined';
  }
}
export default LocalSaveManager;
