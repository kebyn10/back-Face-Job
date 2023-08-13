import { createPool } from 'mysql2/promise'
import {DATABASE, HOST, PASSWORD, PORTDB, USER} from '../config/config.js'



const conexion = createPool({
    host: HOST,
    port:PORTDB,
    user: USER,
    password: PASSWORD,
    database: DATABASE
})



export default conexion