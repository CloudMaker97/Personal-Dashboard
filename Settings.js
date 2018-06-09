var Settings = {
  FritzBox: {
    username: '',
    password: '',
    server: 'fritz.box',
    protocol: 'http'
  },

  Modules: {
    CallMonitor: {
      IsActivated: false
    },

    GoogleCal: {
      IsActivated: false,

      Url_ICS: ""
    },

    FinTS_HCBI: {
      IsActivated: true,

      Interfaces: {
        '12345':{'blz':12345,'url':"FINTS-URL"}
      },

      Authentification: {
        mBLZ: 12345,
        mUser: "12345",
        mPassword: "PASS"
      }
    },
  }
}

module.exports = Settings;
