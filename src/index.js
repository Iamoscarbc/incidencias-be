import express from 'express'
import path from 'path'
import bodyParser from 'body-parser'
import {fileURLToPath} from 'url'
import fileUpload from 'express-fileupload'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
const app = express()
import fs from 'fs'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
import "./config/loadEnvironment.js"
import mongoose from 'mongoose'
import moment from "moment";

import { Incidence, Users, Profiles, Categories } from './models/index.js'

app.use(bodyParser.urlencoded({
  extended: true,
  charset: 'UTF-8'
}))

app.use(bodyParser.json());

app.set('port', process.env.PORT || 3000)
app.set('json spaces', 1)

app.use(fileUpload())

//Routes
app.get('/api/incidences', tokenVerify, async (req, res) => {
    try{
      let user = await Users.findOne({ _id: req.userId })
      let collection
      if(user.idProfile == '653752a46f75ce25da5cb7dd'){
        collection = await Incidence.find({ specialist: req.userId }).populate({
          path: "idUser",
          model: Users,
          select: "firstname lastname phone docnumber email",
        })
      }else if(user.idProfile == '653752946f75ce25da5c73e3'){
        collection = await Incidence.find({ idUser: req.userId }).populate({
          path: "idUser",
          model: Users,
          select: "firstname lastname phone docnumber email",
        })
      }else {
        collection = await Incidence.find().populate({
          path: "idUser",
          model: Users,
          select: "firstname lastname phone docnumber email",
        })
      }
      res.json({
        success: true,
        message: "Incidences obtained!!",
        data: collection
      })
    } catch (err) {
      console.error(err)
      res.json({
        success: false,
        error: err
      })
    }
})

app.get('/api/incidence/:id', tokenVerify, async (req, res) => {
  try{
    let collection = await Incidence.findById(req.params.id).populate({
      path: "idUser",
      model: Users,
      select: "firstname lastname phone docnumber email",
    })
    res.json({
      success: true,
      message: "Incidences obtained!!",
      data: collection
    })
  } catch (err) {
    console.error(err)
    res.json({
      success: false,
      error: err
    })
  }
})

app.post('/api/incidences', tokenVerify, async (req, res) => {
  try{
    let {date, categorie, description, documentNumber} = req.body
    let as = await Incidence.create({
      date,
      idUser: req.userId,
      categorie,
      documentNumber,
      description,
      timeline: [
        {
          title: 'Registrada',
          completed: true,
        },
        {
          title: 'En revisión',
          completed: false,
        },
        {
          title: 'Finalizada',
          completed: false,
        },
      ]
    })
    
    let route = path.join(__dirname, `/documents/Incidences/${as._id}`)
    if(! await fs.existsSync(route)){
      await fs.mkdirSync(route)
    }

    res.json({
      success: true,
      message: "Incidence created!!",
      data: as._id
    })
  } catch (err) {
    console.error(err)
    res.json({
      success: false,
      error: err
    })
  }
})

app.put('/api/incidence/:id', tokenVerify, async (req, res) => {
  try{
    let { specialist } = req.body

    if(!!req.files){
      let route = path.join(__dirname, `/documents/Incidences/${req.params.id}`)
      let documents 
      if(!!req.files.file.length){
        for (let i = 0; i < req.files.file.length; i++) {
          const d = req.files.file[i];
          await fs.writeFileSync(path.join(route, d.name), d.data)
        }
        documents = req.files.file.map(d => {
          return {
            src: path.join(route, d.name),
            name: d.name,
            type: d.mimetype
          }
        })
      }else{
        await fs.writeFileSync(path.join(route, req.files.file.name), req.files.file.data)
        documents = [
          { src: path.join(route, req.files.file.name), name: req.files.file.name, type: req.files.file.mimetype }
        ]
      }
  
      await Incidence.findOneAndUpdate({_id: req.params.id},{
        documents,
        specialist,
        timeline: [
          {
            title: 'Registrada',
            completed: true,
          },
          {
            title: 'En revisión',
            completed: true,
          },
          {
            title: 'Finalizada',
            completed: false,
          },
        ]
      })
    }else{
      await Incidence.findOneAndUpdate({_id: req.params.id},{
        specialist,
        timeline: [
          {
            title: 'Registrada',
            completed: true,
          },
          {
            title: 'En revisión',
            completed: true,
          },
          {
            title: 'Finalizada',
            completed: false,
          },
        ]
      })
    }

    res.json({
      success: true,
      message: "Incidence updated!!"
    })
  } catch (err) {
    console.error(err)
    res.json({
      success: false,
      error: err
    })
  }
})

app.put('/api/finalize-incidence/:id', tokenVerify, async (req, res) => {
  try{    
    await Incidence.findOneAndUpdate({_id: req.params.id},{
      timeline: [
        {
          title: 'Registrada',
          completed: true,
        },
        {
          title: 'En revisión',
          completed: true,
        },
        {
          title: 'Finalizada',
          completed: true,
        },
      ]
    })

    res.json({
      success: true,
      message: "Incidence finalized!!"
    })
  } catch (err) {
    console.error(err)
    res.json({
      success: false,
      error: err
    })
  }
})

app.get('/api/files/:id/:name', (req, res) => {
  let route = path.join(__dirname, `/documents/Incidences/${req.params.id}`, req.params.name)
  res.sendFile(route)
})

app.get('/api/users', tokenVerify, async (req, res) => {
    try{
      let collection = await Users.find({ state: 1 }, ['firstname','lastname','phone','docnumber','email']).populate({
        path: "idProfile",
        model: Profiles,
        select: "name",
      })
      res.json({
        success: true,
        message: "Users obtained!!",
        data: collection
      })
    } catch (err) {
      console.error(err)
      res.json({
        success: false,
        error: err
      })
    }
})

app.get('/api/user/:id', tokenVerify, async (req, res) => {
    try{
      let collection = await Users.findById(req.params.id, 'firstname lastname docnumber phone email idProfile')
      collection.password = ''
      res.json({
        success: true,
        message: "User obtained!!",
        data: collection
      })
    } catch (err) {
      console.error(err)
      res.json({
        success: false,
        error: err
      })
    }
})

app.post('/api/user', tokenVerify, async (req, res) => {
  const { firstname, lastname, phone, docnumber, email, password, idProfile } = req.body;

  try {
    const usuarioExistente = await Users.findOne({ docnumber });
    if (usuarioExistente) return res.status(409).json({
      success: false,
      message: 'Este usuario ya ha sido registrado'
    });

    const hash = await bcrypt.hash(password, 10);

    Users.create({
      firstname,
      lastname,
      phone,
      docnumber,
      email,
      password: hash,
      idProfile,
      state: 1
    });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
})

app.put('/api/user/:id', tokenVerify, async (req, res) => {
  try{
    let { docnumber, firstname, idProfile, lastname, password, phone, email } = req.body

    const hash = await bcrypt.hash(password, 10);

    let json = {
      firstname,
      lastname,
      phone,
      docnumber,
      email,
      idProfile
    }
    if(!!password){
      json.password = hash
    }

    await Users.findOneAndUpdate({_id: req.params.id}, json)

    res.json({
      success: true,
      message: "User updated!!"
    })
  } catch (err) {
    console.error(err)
    res.json({
      success: false,
      error: err
    })
  }
})

app.delete('/api/user/:id', tokenVerify, async (req, res) => {
  try{    
    await Users.findOneAndUpdate({_id: req.params.id}, {
      state: 0
    })

    res.json({
      success: true,
      message: "User deactivated!!"
    })
  } catch (err) {
    console.error(err)
    res.json({
      success: false,
      error: err
    })
  }
})

app.get('/api/userByProfile/:id', tokenVerify, async (req, res) => {
  try{    
    let data = await Users.find({idProfile: req.params.id}, ['firstname','lastname','phone','docnumber','email'])

    res.json({
      success: true,
      message: "List of User By Profile " + req.params.id,
      data
    })
  } catch (err) {
    console.error(err)
    res.json({
      success: false,
      error: err
    })
  }
})

app.get('/api/categories', tokenVerify, async (req, res) => {
  try{    
    let data = await Categories.find()

    res.json({
      success: true,
      message: "List of Categories",
      data
    })
  } catch (err) {
    console.error(err)
    res.json({
      success: false,
      error: err
    })
  }
})

app.get('/api/profiles', tokenVerify, async (req, res) => {
  try{
    let collection = await Profiles.find()
    res.json({
      success: true,
      message: "Profiles obtained!!",
      data: collection
    })
  } catch (err) {
    console.error(err)
    res.json({
      success: false,
      error: err
    })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { docnumber, password } = req.body;

  try {
    // Verificar si el usuario existe en la base de datos
    const userFound = await Users.findOne({ docnumber: docnumber });
    if (!userFound) return res.status(404).json({
      success: false,
      message: 'Usuario no encontrado'
    });

    // Verificar si la contraseña es correcta
    const isPasswordValid = await bcrypt.compare(password, userFound.password);
    if (!isPasswordValid) return res.status(401).json({
      success: false,
      message: 'Usuario o Contraseña incorrecta'
    });

    // Generar un token JWT
    const token = jwt.sign({ id: userFound._id }, 'SecretKey123', { expiresIn: 86400 });
    res.status(200).json({
      success: true,
      token,
      message: 'Login exitoso'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
})

app.get('/api/auth/user', tokenVerify, async (req, res) => {
  try {
    let user = await Users.findOne({ _id: req.userId }, ['firstname','lastname','phone','docnumber','email']).populate({
      path: "idProfile",
      model: Profiles,
      select: "name roles",
    })
    res.status(200).json({
      success: true,
      message: 'Lista de usuarios',
      user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
})

app.post('/api/auth/logout', tokenVerify, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logout exitoso'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
})

app.get('/api/indicators/:period', tokenVerify, async (req, res) => {
    try{
      let period = req.params.period
      const startDate = moment(period, "YYYYMM").startOf('month').format('YYYY-MM-DD');
      const endDate = moment(period, "YYYYMM").endOf('month').format('YYYY-MM-DD');
      const between = {
        $gte: startDate,
        $lt: endDate
      }
      let incidences = await Incidence.aggregate([
        {
          $match: {
            date: between
          }
        }
      ])
      const array = Number(moment(period, "YYYYMM").endOf('month').format("DD"));
      const responseGraphic1 = [];
      for (let index = 1; index < array + 1; index++) {
          let day = "";
          day = index
          if (index <= 9) {
              day = "0" + index
          }
          const fechaX = `${period}${day}`
          let fechaPP = moment(fechaX, "YYYYMMDD").format("YYYY-MM-DD");
          const listI = incidences.filter(x => x.date == fechaPP)
          const body = {
            incidences: listI.length,
            date: moment(fechaX, "YYYYMMDD").format("DD/MM/YYYY")
          }
          responseGraphic1.push(body)
      }

      let responseGraphic2 = await Incidence.aggregate([
        {
          $match: {
            date: between
          }
        },
        {
          $group:{
            _id: "$idUser",
            count: { $sum: 1 }
          }
        }
      ])
      await Users.populate(responseGraphic2, {
        path: '_id',
        select: 'user'
      })

      res.json({
        success: true,
        message: "Indicators obtained!!",
        data: {
          graphic1: responseGraphic1,
          graphic2: responseGraphic2
        }
      })
    } catch (err) {
      console.error(err)
      res.json({
        success: false,
        error: err
      })
    }
})

async function tokenVerify(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ success: false, mensaje: 'No se inició sesión' });

  try {
    const decoded = jwt.verify(token.split(' ')[1], 'SecretKey123');
    
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, mensaje: 'Token inválido' });
  }
}

app.listen(3000, () => {
    console.log("Server is listening on port 3000")
})