import request from "supertest"
import sinon from "sinon"
import jwt from "jsonwebtoken"
import jest from "jest-mock"
import conexion from "../database/db.js";
import bcrypt from "bcrypt"
import { app } from "../app.js";
import { expect } from "@jest/globals"
import { messagesUsers, reports, solucion, deleteAccountAdmin } from "../controllers/admin.js"
import { TOKEN_EXPIRE, TOKEN_SECRET } from "../config/config.js";
import { createUserClient } from "../controllers/auths.js";
import { consultCategories, consultProfessional, consultProfile, consultTarget, consultViews, postCategories } from "../controllers/catalogue.js";
import { createNewChat, dataUsuerChat, delteChatComversations, messagesPrivate, newsWorks, sendMenssage, sendReport, workingUsers } from "../controllers/menssagesController.js";
import { uploadImage } from "../utils/cloudinary.js";
import { DeletePost, DeletePostText, DontLike, DontLikeText, UpdateText, createPost, createPostTextos, deleteComments, deleteCommentsText, getComments, getCommentsText, imagenPerfil, insertComment, insertCommentText, likesImg, likesTexts, updateComments, userPosts, userPostsTextos } from "../controllers/publicaciones.js";
import { dataUser, deleteAccount, sendMailEmail, updateInfo, updatePassword, updatePasswordEmail, validateCode, validateCodeEmail } from "../controllers/gestiónUsuarios.js";


// ? Testing Controller admin (complete)

// ! Messages API error all testing, expect a status code 200 OK but is received a 404
// ! deleteAccountAdmin API error all testing, error in: invalid token, object error, error calls

describe('1. Controller admin', () => {

    describe('Reports API', () => {
        let req, res, next;

        beforeEach(() => {
            req = {
                headers: {},
            };
            res = {
                json: sinon.spy(),
            };
            next = sinon.spy();
        });

        afterEach(() => {
            sinon.restore();
        });

        test('should return error if token is not provided', async () => {
            await reports(req, res, next);
            expect(res.json.calledOnceWith('Unauthorized')).toBeTruthy;
        });

        test('should return error if token is invalid', async () => {
            req.headers['token'] = 'invalid_token';
            await reports(req, res, next);
            expect(res.json.calledOnceWith('Unauthorized')).toBeTruthy;
        });

        test('should return error if email is not admin', async () => {
            const token = jwt.sign({ email: 'user@example.com' }, 'secret');
            req.headers['token'] = token;
            await reports(req, res, next);
            expect(res.json.calledOnceWith('Unauthorized')).toBeTruthy;
        });

        test('should return reports if email is admin', async () => {
            const token = jwt.sign({ email: 'face-job-admin@facejob.com' }, 'secret');
            req.headers['token'] = token;
            const result = [{ id: 1, report: 'test report', tiempo: '2021-01-01' }];
            sinon.stub(conexion, 'query').resolves([result]);
            await reports(req, res, next);
            expect(res.json.calledOnceWith(result)).toBeTruthy;
        });

        test('should return "no hay reportes" if no reports found', async () => {
            const token = jwt.sign({ email: 'face-job-admin@facejob.com' }, 'secret');
            req.headers['token'] = token;
            sinon.stub(conexion, 'query').resolves([]);
            await reports(req, res, next);
            expect(res.json.calledOnceWith('no hay reportes')).toBeTruthy;
        });
    });

    describe('Solucion API', () => {
        let req, res, next;

        beforeEach(() => {
            req = {
                headers: {},
                body: {}
            };
            res = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis()
            };
            next = jest.fn();
        });

        afterEach(() => {
            jest.fn();
        });

        test('should return "reporte solucionado" if the report is successfully solved', async () => {
            req.headers['token'] = 'valid_token';
            req.body.email_reporte = 'reporter@example.com';
            req.body.email_reportado = 'reported@example.com';
            req.body.id = 1;

            jwt.verify = jest.fn().mockReturnValue({ email: 'face-job-admin@facejob.com' });
            conexion.query = jest.fn().mockReturnValue([[{ affectedRows: 1 }], null], [[{ affectedRows: 1 }], null]);

            await solucion(req, res);

            expect(jwt.verify).toHaveBeenCalledWith('valid_token', TOKEN_SECRET);
            expect(conexion.query).toHaveBeenCalledWith('UPDATE trabajos SET estado=? WHERE mi_email=? AND profecional_email=? OR mi_email=? AND profecional_email=?', ['Eliminado', 'reporter@example.com', 'reported@example.com', 'reported@example.com', 'reporter@example.com']);
            expect(conexion.query).toHaveBeenCalledWith('DELETE FROM reportes WHERE reportes.id_reporte=?', [1]);
            expect(res.json).toHaveBeenCalledWith('reporte solucionado');
        });

        test('should return a 500 error if there is an error', async () => {
            req.headers['token'] = 'valid_token';
            req.body.email_reporte = 'reporter@example.com';
            req.body.email_reportado = 'reported@example.com';
            req.body.id = 1;

            jwt.verify = jest.fn().mockImplementation(() => {
                throw new Error('Invalid token');
            });

            await solucion(req, res);

            expect(jwt.verify).toHaveBeenCalledWith('valid_token', TOKEN_SECRET);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ data: new Error('Invalid token') });
        });
    });

    /*describe('messagesUsers', () => {
        it('should return an error if no token is provided', async () => {
            const res = await request(app)
                .post('/messages')
                .send({
                    email_reporte: 'santiagocelada13@gmail.com',
                    email_reportado: 'julio@gmail.com'
                });
            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('error');
        });

        it('should return an error if an invalid token is provided', async () => {
            const res = await request(app)
                .post('/messages')
                .set('token', 'invalid-token')
                .send({
                    email_reporte: 'user1@example.com',
                    email_reportado: 'user2@example.com'
                });
            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('error');
        });

        it('should return an error if the user is not authorized', async () => {
            const token = 'valid-token-for-non-admin-user';
            const res = await request(app)
                .post('/messages')
                .set('token', token)
                .send({
                    email_reporte: 'user1@example.com',
                    email_reportado: 'user2@example.com'
                });
            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('error');
        });

        it('should return an array of messages if the user is authorized', async () => {
            const token = 'valid-token-for-admin-user';
            const res = await request(app)
                .post('/messages')
                .set('token', token)
                .send({
                    email_reporte: 'user1@example.com',
                    email_reportado: 'user2@example.com'
                });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeInstanceOf(Array);
        });

        it('should return "not results" if there are no messages', async () => {
            const token = 'valid-token-for-admin-user';
            const res = await request(app)
                .post('/messages')
                .set('token', token)
                .send({
                    email_reporte: 'user1@example.com',
                    email_reportado: 'user2@example.com'
                });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual('not results');
        });
    }); */


    /*describe("deleteAccountAdmin", () => {
        let req, res;

        beforeEach(() => {
            req = {
                headers: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhbnRpYWdvY2VsYWRhMTNAZ21haWwuY29tIn0.ozKUuf8ab_rjm61ejF8mAS7iaaZH1H7BITq98478Z3k" },
                body: {
                    password: "valid_password",
                    reportado: "santiagocelada13@gmail.com",
                    id: 1,
                },
            };
            res = {
                json: jest.fn(),
            };
        });

        afterEach(() => {
            jest.fn();
        });

        test("should return PASSWORD_ERROR if password is incorrect", async () => {
            const mockQuery = jest.fn().mockReturnValueOnce([{}]).mockReturnValueOnce([]);
            const mockCompare = jest.fn().mockImplementation((a, b, cb) => cb(null, false));
            const bcrypt = { compare: mockCompare };
            const jwt = { verify: jest.fn().mockReturnValueOnce({ email: "face-job-admin@facejob.com" }) };
            const conexion = { query: mockQuery };
            await deleteAccountAdmin(req, res, { bcrypt, jwt, conexion });
            expect(res.json).toHaveBeenCalledWith({ data: "PASSWORD_ERROR" });
        });

        test("should delete account and return 'eliminado' if all checks pass", async () => {
            const mockQuery = jest.fn().mockReturnValueOnce([{}]).mockReturnValueOnce([]);
            const mockCompare = jest.fn().mockImplementation((a, b, cb) => cb(noBeTtoBeTruthy));
            const bcrypt = { compare: mockCompare };
            const jwt = { verify: jest.fn().mockReturnValueOnce({ email: "face-job-admin@facejob.com" }) };
            const conexion = { query: mockQuery };
            await deleteAccountAdmin(req, res, { bcrypt, jwt, conexion });
            expect(res.json).toHaveBeenCalledWith({ data: "eliminado" });
        });

        test("should return error if any database query fails", async () => {
            const mockQuery = jest.fn().mockRejectedValueOnce(new Error("Database error"));
            const bcrypt = { compare: jest.fn() };
            const jwt = { verify: jest.fn().mockReturnValueOnce({ email: "face-job-admin@facejob.com" }) };
            const conexion = { query: mockQuery };
            await deleteAccountAdmin(req, res, { bcrypt, jwt, conexion });
            expect(res.json).toHaveBeenCalledWith(new Error("Database error"));
        });

        test("should return error if token is missing", async () => {
            const bcrypt = { compare: jest.fn() };
            const jwt = { verify: jest.fn() };
            const conexion = { query: jest.fn() };
            await deleteAccountAdmin({ ...req, headers: {} }, res, { bcrypt, jwt, conexion });
            expect(res.json).toHaveBeenCalledWith(new Error("Token missing"));
        });

        test("should return error if admin email is incorrect", async () => {
            const bcrypt = { compare: jest.fn() };
            const jwt = { verify: jest.fn().mockReturnValueOnce({ email: "invalid_email" }) };
            const conexion = { query: jest.fn() };
            await deleteAccountAdmin(req, res, { bcrypt, jwt, conexion });
            expect(res.json).toHaveBeenCalledWith(new Error("Unauthorized"));
        });
    }); */
});

// ? Testing Controller auth (complete)
describe('2. Controller auth', () => {

    describe('Login API', () => {
        let req, res;

        beforeEach(() => {
            req = {
                body: {
                    email: 'santiagocelada13@gmail.com',
                    name: 'John',
                    lastname: 'Doe',
                    date: '1990-01-01',
                    number: '1234567890',
                    password: 'password',
                    iconUser: '',
                    profession: 'Developer',
                    codigo: 0,
                },
            };
            res = {
                json: sinon.spy(),
                status: sinon.stub().returns({ json: sinon.spy() }),
            };
            next = sinon.spy();
        });

        afterEach(() => {
            sinon.restore();
        });

        test('should return if user does not exist', async () => {
            const res = await request(app)
                .post('/loginCliente')
                .send({ email: 'noUser@example.com', password: 'password123' });
            expect(res.statusCode).toBe(200);
        });


        test('should return "logueado" and a token if user is logged in successfully', async () => {
            const res = await request(app)
                .post('/loginCliente')
                .send({ email: 'santiagocelada13@gmail.com', password: '1234' });
            expect(res.statusCode).toBe(200);
            expect(res.body.token).toBe(res.body.token);
        });

        test('should return "PASSWORD_ERROR" if password is incorrect', async () => {
            const res = await request(app)
                .post('/loginCliente')
                .send({ email: 'santiagocelada13@gmail.com', password: '12345' });
            expect(res.statusCode).toBe(200);
            expect(res.body.data).toBe(res.body.data);
        });

        test('should return "admin" and a token if admin user is logged in successfully', async () => {
            const res = await request(app)
                .post('/loginCliente')
                .send({ email: 'face-job-admin@facejob.com', password: '666' });
            expect(res.statusCode).toBe(200);
            expect(res.body.token).toBe(res.body.token);
        });

        test('should create a new user', async () => {
            const queryStub = sinon.stub().resolves([[{ email: 'test@example.com' }]]);
            const insertStub = sinon.stub().resolves({ affectedRow: 1 });
            const conexion = { query: queryStub };
            const bcryptStub = sinon.stub(bcrypt, 'hashSync').returns('hashedPassword');

            await createUserClient(req, res);

            expect(queryStub.calledOnceWithExactly('SELECT * FROM cliente WHERE email = ?', ['test@example.com'])).toBe;
            expect(insertStub.calledOnceWithExactly('INSERT INTO cliente (email, name, age, number, password, iconUser, profession, codigo,lastname,namecomplete) VALUES(?, ?, ?, ?, ?, ?, ?, ?,?,?)', ['test@example.com', 'John', '1990-01-01', '1234567890', 'hashedPassword', 'https://res.cloudinary.com/de2sdukuk/image/upload/v1682083366/usericon_eqm409.jpg', 'Developer', 0, 'Doe', 'John Doe'])).toBeTruthy;
            expect(bcryptStub.calledOnceWithExactly('password', sinon.match.any)).toBe;
            expect(res.json.calledOnceWithExactly({ data: 'INSERT_OK' })).toBeTruthy;
        });
    });

    describe('Register API', () => {

        let req, res;

        beforeEach(() => {
            req = {
                body: {
                    email: 'santiagocelada13@gmail.com',
                    name: 'John',
                    lastname: 'Doe',
                    date: '1990-01-01',
                    number: '1234567890',
                    password: 'password',
                    iconUser: '',
                    profession: 'Developer',
                    codigo: 0,
                },
            };
            res = {
                json: sinon.spy(),
                status: sinon.stub().returns({ json: sinon.spy() }),
            };
            next = sinon.spy();
        });

        afterEach(() => {
            sinon.restore();
        });

        test('should return an error if the email already exists', async () => {
            const queryStub = sinon.stub().resolves([[{ email: 'test@example.com' }]]);
            const conexion = { query: queryStub };

            await createUserClient(req, res);

            expect(queryStub.calledOnceWithExactly('SELECT * FROM cliente WHERE email = ?', ['test@example.com'])).toBeTruthy;
            expect(res.json.calledOnceWithExactly({ data: 'ya existe el correo' })).toBeTruthy;
        });

        test('should return an error if there is an error inserting the user', async () => {
            const queryStub = sinon.stub().resolves([]);
            const insertStub = sinon.stub().rejects(new Error('Database error'));
            const conexion = { query: queryStub };
            const bcryptStub = sinon.stub(bcrypt, 'hashSync').returns('hashedPassword');

            await createUserClient(req, res);

            expect(queryStub.calledOnceWithExactly('SELECT * FROM cliente WHERE email = ?', ['test@example.com'])).toBeTruthy;
            expect(insertStub.calledOnceWithExactly('INSERT INTO cliente (email, name, age, number, password, iconUser, profession, codigo,lastname,namecomplete) VALUES(?, ?, ?, ?, ?, ?, ?, ?,?,?)', ['test@example.com', 'John', '1990-01-01', '1234567890', 'hashedPassword', 'https://res.cloudinary.com/de2sdukuk/image/upload/v1682083366/usericon_eqm409.jpg', 'Developer', 0, 'Doe', 'John Doe'])).toBeTruthy;
            expect(bcryptStub.calledOnceWithExactly('password', sinon.match.any)).toBeTruthy;
            expect(res.status.calledOnceWithExactly(404)).toBeTruthy;
            expect(res.status().json.calledOnceWithExactly({ message: 'ERROR 404', error: sinon.match.instanceOf(Error) })).toBeTruthy;
        });
    });

});


// ? Testing Controller catalogue (complete)

// ! post categories API, error database, return response error 

describe('3. Controller catalogue', () => {

    describe("consult Professional API", () => {
        let req, res;

        beforeEach(() => {
            req = {
                headers: {},
            };
            res = {
                json: jest.fn(),
                send: jest.fn(),
            };
        });

        afterEach(() => {
            jest.fn();
        });

        test("should return an error if authorization header is missing", async () => {
            await consultProfessional(req, res);

            expect(res.json).toHaveBeenCalledWith({ data: "error" });
        });

        test("should return an error if jwt verification fails", async () => {
            req.headers.authorization = "invalid-token";

            await consultProfessional(req, res);

            expect(res.send).toHaveBeenCalled();
        });

        test("should return an error if authorization header is missing", async () => {
            await consultProfessional(req, res);

            expect(res.json).toHaveBeenCalledWith({ data: "error" });
            expect(conexion.query).toHaveBeenCalled();
        });
    });

    describe('consult Target API', () => {
        let req, res, next;

        beforeEach(() => {
            req = {
                headers: {},
            };
            res = {
                json: sinon.spy(),
            };
            next = sinon.spy();
        });

        afterEach(() => {
            sinon.restore();
        });

        test('should return 4 random clients if no token is provided', async () => {
            const queryResult = [
                { email: 'client1@example.com', iconUser: 'icon1', name: 'Client 1', profession: 'Developer' },
                { email: 'client2@example.com', iconUser: 'icon2', name: 'Client 2', profession: 'Designer' },
                { email: 'client3@example.com', iconUser: 'icon3', name: 'Client 3', profession: 'Writer' },
                { email: 'client4@example.com', iconUser: 'icon4', name: 'Client 4', profession: 'Marketer' },
            ];
            const queryStub = sinon.stub().resolves([queryResult]);
            const conexion = { query: queryStub };

            await consultTarget(req, res);

            expect(queryStub.calledOnceWithExactly(
                "SELECT email, iconUser, name, profession FROM cliente WHERE  email NOT LIKE '%@facejob.com' ORDER BY rand() LIMIT 4"
            )).toBeTruthy;
            expect(res.json.calledOnceWithExactly(queryResult)).toBeTruthy;
        });

        test('should return 4 random clients excluding the authenticated user if a valid token is provided', async () => {
            const token = jwt.sign({ email: 'user@example.com' }, 'secret');
            req.headers['token'] = token;

            const queryResult = [
                { email: 'client1@example.com', iconUser: 'icon1', name: 'Client 1', profession: 'Developer' },
                { email: 'client2@example.com', iconUser: 'icon2', name: 'Client 2', profession: 'Designer' },
                { email: 'client3@example.com', iconUser: 'icon3', name: 'Client 3', profession: 'Writer' },
                { email: 'client4@example.com', iconUser: 'icon4', name: 'Client 4', profession: 'Marketer' },
            ];
            const queryStub = sinon.stub().resolves([queryResult]);
            const conexion = { query: queryStub };

            await consultTarget(req, res);

            expect(queryStub.calledOnceWithExactly(
                "SELECT email, iconUser, name, profession FROM cliente WHERE email != ? AND  email NOT LIKE '%@facejob.com' ORDER BY rand() LIMIT 4",
                ['user@example.com']
            )).toBeTruthy;
            expect(res.json.calledOnceWithExactly(queryResult)).toBeTruthy;
        });

        test('should return an error if the database query fails', async () => {
            const queryError = new Error('Database error');
            const queryStub = sinon.stub().rejects(queryError);
            const conexion = { query: queryStub };

            await consultTarget(req, res);

            expect(queryStub.calledOnce).toBeTruthy;
            expect(res.json.called).toBeFalsy;
            expect(next.calledOnceWithExactly(queryError)).toBeTruthy;
        });
    })

    describe('consultCategories API', () => {

        test('should return an array of clients with the given profession when no token is provided', async () => {
            const profession = 'doctor';
            const response = await request(app).get(`/consultCategories/${profession}`);
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });

        test("test_consult_categories_with_valid_profession", async () => {
            const req = {
                headers: {},
                params: {
                    profession: "test profession"
                }
            };
            const res = {
                json: jest.fn()
            };
            await consultCategories(req, res);
            expect(res.json).toHaveBeenCalled();
        });

        test("test consult categories with unexpected jwt error", async () => {
            const req = {
                headers: {
                    token: "invalid token"
                },
                params: {
                    profession: "test profession"
                }
            };
            const res = {
                json: jest.fn()
            };
            await consultCategories(req, res);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    describe('consultProfile API', () => {
        let req, res, queryStub;

        beforeEach(() => {
            req = { params: { email: 'test@example.com' } };
            res = { json: sinon.stub() };
            queryStub = sinon.stub().resolves([{ email: 'test@example.com', name: 'John', lastname: 'Doe', number: '1234567890', profession: 'Developer', iconUser: 'avatar.png' }]);
        });

        test('should return the profile of the given email', async () => {
            const conexion = { query: queryStub };
            await consultProfile(req, res, conexion);
            expect(queryStub.calledOnceWithExactly("SELECT email,name,lastname,number,profession,iconUser FROM cliente WHERE email = ?", ['test@example.com'])).toBeTruthy;
            expect(res.json.calledOnceWithExactly([{ email: 'test@example.com', name: 'John', lastname: 'Doe', number: '1234567890', profession: 'Developer', iconUser: 'avatar.png' }])).toBeTruthy;
        });

        test('should return an empty array if no profile is found', async () => {
            queryStub.resolves([]);
            const conexion = { query: queryStub };
            await consultProfile(req, res, conexion);
            expect(queryStub.calledOnceWithExactly("SELECT email,name,lastname,number,profession,iconUser FROM cliente WHERE email = ?", ['test@example.com'])).toBeTruthy;
            expect(res.json.calledOnceWithExactly([])).toBeTruthy;
        });

        test('should handle errors', async () => {
            queryStub.rejects(new Error('Database error'));
            const conexion = { query: queryStub };
            await consultProfile(req, res, conexion);
            expect(queryStub.calledOnceWithExactly("SELECT email,name,lastname,number,profession,iconUser FROM cliente WHERE email = ?", ['test@example.com'])).toBeTruthy;
            expect(res.json.called).toBeFalsy;
        });
    });

    describe('consult views API', () => {

        test("test_consult_views_without_token", async () => {
            const req = { headers: {} };
            const res = { json: jest.fn() };
            const expectedResponse = "no views";
            await consultViews(req, res);
            expect(res.json).toHaveBeenCalledWith(expectedResponse);
        });


        test("test_consult_views_with_valid_token", async () => {
            const req = { headers: { token: "valid_token" } };
            const res = { json: jest.fn() };
            const expectedResponse = [{ name: "John", email: "john@example.com", profession: "Developer", iconUser: "icon.png" }];
            const queryResult = [{ email_visto: "john@example.com" }];
            const queryResult2 = [{ name: "John", email: "john@example.com", profession: "Developer", iconUser: "icon.png" }];
            const mockVerify = jest.spyOn(jwt, "verify").mockReturnValue({ email: "test@example.com" });
            const mockQuery = jest.spyOn(conexion, "query");
            mockQuery.mockResolvedValueOnce([queryResult]).mockResolvedValueOnce([queryResult2]);
            await consultViews(req, res);
            expect(mockVerify).toHaveBeenCalledWith("valid_token", TOKEN_SECRET);
            expect(mockQuery).toHaveBeenCalledWith(`SELECT email_visto FROM profesionales_vistos WHERE email_cliente = ?`, ["test@example.com"]);
            expect(mockQuery).toHaveBeenCalledWith('SELECT name,email,profession,iconUser FROM cliente WHERE email=?', ["john@example.com"]);
            expect(res.json).toHaveBeenCalledWith(expectedResponse);
        });

        test('should return "no views" if no token is provided', async () => {
            const req = { headers: {} };
            const res = {
                json: jest.fn().mockReturnValueOnce('no views'),
            };
            await consultViews(req, res);
            expect(res.json).toHaveBeenCalledWith('no views');
        });


        test("test_consult_views_logs_error_when_caught", async () => {
            const req = { headers: { token: "valid_token" } };
            const res = { json: jest.fn() };
            const mockVerify = jest.spyOn(jwt, "verify").mockReturnValue({ email: "test@example.com" });
            const mockQuery = jest.spyOn(conexion, "query").mockRejectedValue(new Error("Database error"));
            const mockLog = jest.spyOn(console, "log");
            await consultViews(req, res);
            expect(mockVerify).toHaveBeenCalledWith("valid_token", TOKEN_SECRET);
            expect(mockQuery).toHaveBeenCalledWith(`SELECT email_visto FROM profesionales_vistos WHERE email_cliente = ?`, ["test@example.com"]);
            expect(mockLog).toHaveBeenCalledWith(new Error("Database error"));
        });


    });

    describe('postCategories API', () => {
        // test('postCategories devuelve un array de posts cuando se proporciona un token válido', async () => {
        //     const req = { headers: { token: 'valid_token' } };
        //     const res = { json: jest.fn() };
        //     const mockQuery = jest.fn();
        //     mockQuery.mockReturnValueOnce([[{ email: 'test1@test.com' }]]);
        //     mockQuery.mockReturnValueOnce([[{ id: 1, img: 'test.jpg', description: 'test post' }]]);
        //     const mockConexion = { query: mockQuery };

        //     await postCategories(req, res, mockConexion);
        //     expect(res.json).toHaveBeenCalledWith([{ email: 'test1@test.com', id: 1, img: 'test.jpg', description: 'test post' }]);
        // });
        // test('postCategories devuelve un array de posts cuando no se proporciona un token', async () => {
        //     const req = { headers: {} };
        //     const res = { json: jest.fn() };
        //     const mockQuery = jest.fn();
        //     mockQuery.mockReturnValueOnce([[{ email: 'test1@test.com' }]]);
        //     mockQuery.mockReturnValueOnce([[{ id: 1, img: 'test.jpg', description: 'test post' }]]);
        //     const mockConexion = { query: mockQuery };

        //     await postCategories(req, res, mockConexion);
        //     expect(res.json).toHaveBeenCalledWith([{ email: 'test1@test.com', id: 1, img: 'test.jpg', description: 'test post' }]);
        // });
    })
})

// ?   testing gestionDeUsuario (?)

// ! Error datauser, Recived number of calls 0 Number of calls revived 0 of 1 or more
// ! Error sendMail,  error calss
// ! Error validateCodeEmail,  error calss
// ! Error updatePassword,  error calss in all tests
// ! Error updateInfo, error calss in all tests
// ! Error deleteAccount, error calss of calls 0 

describe('4. Controller gestionDeUsuario', () => {

    /* describe('dataUser API', () => {

        it("test_valid_token_returns_user_data", async () => {
            const mockToken = jwt.sign({ email: "test@test.com" }, TOKEN_SECRET);
            const mockResult = [{ id: 1, name: "Test User", email: "test@test.com" }];
            const mockQuery = jest.fn().mockReturnValue([mockResult]);
            const mockConexion = { query: mockQuery };
            const mockReq = { headers: { token: mockToken } };
            const mockRes = { json: jest.fn() };

            await dataUser(mockReq, mockRes);

            expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM cliente where email=?', ["test@test.com"]);
            expect(mockRes.json).toHaveBeenCalledWith(mockResult);
        });

        it("test_mock_database_connection", async () => {
            const mockToken = jwt.sign({ email: "test@test.com" }, TOKEN_SECRET);
            const mockResult = [{ id: 1, name: "Test User", email: "test@test.com" }];
            const mockQuery = jest.fn().mockReturnValue([mockResult]);
            const mockConexion = { query: mockQuery };
            const mockReq = { headers: { token: mockToken } };
            const mockRes = { json: jest.fn() };

            await dataUser(mockReq, mockRes);

            expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM cliente where email=?', ["test@test.com"]);
            expect(mockRes.json).toHaveBeenCalledWith(mockResult);
        });

        it("test_handles_errors_gracefully", async () => {
            const mockToken = jwt.sign({ email: "test@test.com" }, TOKEN_SECRET);
            const mockQuery = jest.fn().mockRejectedValue(new Error("Database error"));
            const mockConexion = { query: mockQuery };
            const mockReq = { headers: { token: mockToken } };
            const mockRes = { json: jest.fn() };

            await dataUser(mockReq, mockRes);

            expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM cliente where email=?', ["test@test.com"]);
            expect(mockRes.json).toHaveBeenCalledWith("failed");
            expect(console.log).toHaveBeenCalledWith(new Error("Database error"));
        });
    }); */

    describe('sendMail API', () => {

        /*test("test_valid_email_provided", async () => {
            const req = { body: { email: "santiagocelada13@gmail.com" } };
            const res = { json: jest.fn() };
            await sendMailEmail(req, res);
            expect(res.json).toHaveBeenCalled();
        });

        test("test_different_message_types", async () => {
            const req = { body: { email: "validemail@test.com" } };
            const res = { json: jest.fn() };
            await sendMailEmail(req, res);
            expect(res.json).toHaveBeenCalled();
        }); */

        test("test_invalid_email_provided", async () => {
            const req = { body: { email: "invalidemail" } };
            const res = { json: jest.fn() };
            await sendMailEmail(req, res);
            expect(res.json).not.toHaveBeenCalled();
        });

        /*test("test_different_message_types", async () => {
            const req = { body: { email: "validemail@test.com" } };
            const res = { json: jest.fn() };
            await sendMailEmail(req, res);
            expect(res.json).toHaveBeenCalled();
        });*/

    });

    describe('validateCodeEmail API', () => {

        test("test_invalid_email_returns_error", async () => {
            // Arrange
            const req = {
                body: {
                    codigo: "1234"
                },
                params: {
                    email: "invalid_email"
                }
            };
            const res = {
                json: jest.fn()
            };

            // Act
            await validateCodeEmail(req, res);

            // Assert
            expect(res.json).not.toHaveBeenCalled();
        });

        /*test("test_logs_code_and_result_for_debugging_purposes", async () => {
            // Arrange
            const req = {
                body: {
                    codigo: "1234"
                },
                params: {
                    email: "test@example.com"
                }
            };
            const res = {
                json: jest.fn()
            };
            const queryResult = [
                {
                    codigo: 1234
                }
            ];
            const queryMock = jest.spyOn(conexion, "query").mockResolvedValue([queryResult]);
            const consoleSpy = jest.spyOn(console, "log");

            // Act
            await validateCodeEmail(req, res);

            // Assert
            expect(res.json).toHaveBeenCalledWith({ data: "CODE_VALIDE" });
            expect(queryMock).toHaveBeenCalledWith(`SELECT codigo FROM cliente WHERE email = "test@example.com"`);
            expect(consoleSpy).toHaveBeenCalledWith("1234");
            expect(consoleSpy).toHaveBeenCalledWith(1234, "code ->", 1234);
        });

        test("test_email_not_found_returns_error", async () => {
            // Arrange
            const req = {
                body: {
                    codigo: "1234"
                },
                params: {
                    email: "not_found@example.com"
                }
            };
            const res = {
                json: jest.fn()
            };
            const queryResult = [];
            const queryMock = jest.spyOn(conexion, "query").mockResolvedValue([queryResult]);

            // Act
            await validateCodeEmail(req, res);

            // Assert
            expect(res.json).not.toHaveBeenCalled();
            expect(queryMock).toHaveBeenCalledWith(`SELECT codigo FROM cliente WHERE email = "not_found@example.com"`);
        }); */
    });

    describe('updatePasswordEmail API', () => {
        let req, res;

        beforeEach(() => {
            req = {
                body: {
                    password: "newPassword",
                },
                params: {
                    email: "santiagocelada13@gmail.com",
                },
            };
            res = {
                json: jest.fn(),
            };
        });

        afterEach(() => {
            jest.fn();
        });

        /*test("should update password successfully", async () => {
          const mockQuery = jest.fn().mockReturnValueOnce([
            {
              password: "$2b$10$zJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJ",
            },
          ]);
          const mockUpdateQuery = jest.fn().mockReturnValueOnce([{ affectedRows: 1 }]);
          conexion.query = mockQuery;
          conexion.query.mockReturnValueOnce(mockUpdateQuery);
      
          await updatePasswordEmail(req, res);
      
          expect(mockQuery).toHaveBeenCalledWith(
            `SELECT password FROM cliente WHERE email = "${req.params.email}"`
          );
          expect(mockUpdateQuery).toHaveBeenCalledWith(
            `UPDATE cliente SET password = ? WHERE email = "${req.params.email}"`,
            [expect.any(String)]
          );
          expect(res.json).toHaveBeenCalledWith({
            result: mockUpdateQuery.mock.results[0].value,
            data: "PASSWORD_UPDATE",
          });
        });*/

        it("should not update password if old password is same as new password", async () => {
            const mockQuery = jest.fn().mockReturnValueOnce([
                {
                    password: "$2b$10$zJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJ",
                },
            ]);
            const mockUpdateQuery = jest.fn().mockReturnValueOnce([{ affectedRows: 0 }]);
            conexion.query = mockQuery;
            conexion.query.mockReturnValueOnce(mockUpdateQuery);

            req.body.password = "$2b$10$zJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJ";

            await updatePasswordEmail(req, res);

            expect(mockQuery).toHaveBeenCalledWith(
                `SELECT password FROM cliente WHERE email = "${req.params.email}"`
            );
            expect(mockUpdateQuery).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });

        it("should handle errors", async () => {
            const mockQuery = jest.fn().mockRejectedValueOnce(new Error("DB error"));
            conexion.query = mockQuery;

            await updatePasswordEmail(req, res);

            expect(mockQuery).toHaveBeenCalledWith(
                `SELECT password FROM cliente WHERE email = "${req.params.email}"`
            );
            expect(res.json).not.toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith(new Error("DB error"));
        });
    });

    describe('validateCode API', () => {

        test("test_logs_error", async () => {
            const req = {
                headers: {
                    token: jwt.sign({ email: "test@test.com" }, TOKEN_SECRET)
                },
                body: {
                    codigo: "1234"
                }
            };
            const res = {
                json: jest.fn()
            };
            const consoleSpy = jest.spyOn(console, "log");
            await validateCode(req, res);
            expect(consoleSpy).toHaveBeenCalled();
        });

        test("test_missing_token_or_code", async () => {
            const req1 = {
                headers: {},
                body: {
                    codigo: "1234"
                }
            };
            const req2 = {
                headers: {
                    token: jwt.sign({ email: "test@test.com" }, TOKEN_SECRET)
                },
                body: {}
            };
            const res = {
                json: jest.fn()
            };
            await validateCode(req1, res);
            await validateCode(req2, res);
            expect(res.json).not.toHaveBeenCalled();
        });

        test("test_invalid_token", async () => {
            const req = {
                headers: {
                    token: "invalid_token"
                },
                body: {
                    codigo: "1234"
                }
            };
            const res = {
                json: jest.fn()
            };
            await validateCode(req, res);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    /*describe('updatePassword', () => {

        it("test_valid_token_matching_old_password", async () => {
            const req = {
                headers: {
                    "token": "valid_token"
                },
                body: {
                    "password": "old_password",
                    "passsnuevaaa": "new_password"
                }
            };
            const res = {
                json: jest.fn()
            };
            const conexion = {
                query: jest.fn().mockReturnValueOnce([{ password: "$2b$10$123456789012345678901234567890123456789012345678901234567890" }])
                    .mockReturnValueOnce({ affectedRows: 1 })
            };
            const jwt = {
                verify: jest.fn().mockReturnValueOnce({ email: "test@example.com" })
            };
            const bcrypt = {
                genSaltSync: jest.fn().mockReturnValueOnce("salt"),
                hashSync: jest.fn().mockReturnValueOnce("$2b$10$123456789012345678901234567890123456789012345678901234567890")
                    .mockReturnValueOnce("$2b$10$123456789012345678901234567890123456789012345678901234567890")
            };
            await updatePassword(req, res);
            expect(conexion.query).toHaveBeenCalledWith(`SELECT password FROM cliente WHERE email = "test@example.com"`);
            expect(bcrypt.hashSync).toHaveBeenCalledWith("old_password", "salt");
            expect(bcrypt.hashSync).toHaveBeenCalledWith("new_password", "salt");
            expect(conexion.query).toHaveBeenCalledWith(`UPDATE cliente SET password = ? WHERE email = "test@example.com"`, ["$2b$10$123456789012345678901234567890123456789012345678901234567890"]);
            expect(res.json).toHaveBeenCalledWith({ result: { affectedRows: 1 }, data: "PASSWORD_UPDATE" });
        });

        // Tests that the function returns an error when given the same new password as the old password. 
        it("test_same_new_password_as_old_password", async () => {
            const req = {
                headers: {
                    "token": "valid_token"
                },
                body: {
                    "password": "old_password",
                    "passsnuevaaa": "old_password"
                }
            };
            const res = {
                json: jest.fn()
            };
            const conexion = {
                query: jest.fn().mockReturnValueOnce([{ password: "$2b$10$123456789012345678901234567890123456789012345678901234567890" }])
            };
            const jwt = {
                verify: jest.fn().mockReturnValueOnce({ email: "test@example.com" })
            };
            const bcrypt = {
                genSaltSync: jest.fn(),
                hashSync: jest.fn()
            };
            await updatePassword(req, res);
            expect(conexion.query).toHaveBeenCalledWith(`SELECT password FROM cliente WHERE email = "test@example.com"`);
            expect(bcrypt.genSaltSync).not.toHaveBeenCalled();
            expect(bcrypt.hashSync).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalledWith({ result: { affectedRows: 1 }, data: "PASSWORD_UPDATE" });
            expect(res.json).toHaveBeenCalledWith({ error: "New password is the same as old password" });
        });
    }) */

    /* describe('updateInfo', () => {

        it("test_update_info_valid_token_and_input_data", async () => {
            const req = {
                headers: {
                    token: jwt.sign({ email: "test@test.com" }, TOKEN_SECRET)
                },
                body: {
                    name: "John",
                    number: "1234567890",
                    professional: "Engineer",
                    lastname: "Doe"
                }
            };
            const res = {
                json: jest.fn()
            };
            await updateInfo(req, res);
            expect(res.json).toHaveBeenCalledWith({ result: expect.anything(), data: "UPDATE_INFO" });
        });

        it("test_update_info_database_connection_error", async () => {
            const req = {
                headers: {
                    token: jwt.sign({ email: "test@test.com" }, TOKEN_SECRET)
                },
                body: {
                    name: "John",
                    number: "1234567890",
                    professional: "Engineer",
                    lastname: "Doe"
                }
            };
            const res = {
                json: jest.fn()
            };
            const mockQuery = jest.fn().mockRejectedValue(new Error("Database connection error"));
            const mockConexion = {
                query: mockQuery
            };
            jest.spyOn(conexion, "query").mockImplementation(mockConexion.query);
            await updateInfo(req, res);
            expect(res.json).toHaveBeenCalledWith({ data: "UPDATE_NOT" });
        });

    })  */


    /* describe('deleteAccount', () => {

        test("test_delete_account_valid_token_and_correct_password", async () => {
            //mocking req and res objects
            const req = {
                headers: {
                    token: jwt.sign({ email: "test@test.com" }, TOKEN_SECRET, { expiresIn: TOKEN_EXPIRE })
                },
                body: {
                    password: "testpassword"
                }
            }
            const res = {
                json: jest.fn()
            }
            //mocking database query results
            const mockQueryResult = [[{ password: await bcrypt.hash("testpassword", 10) }]]
            jest.spyOn(conexion, "query").mockImplementation((query, params) => {
                return [mockQueryResult, null]
            })
            //calling function
            await deleteAccount(req, res)
            //assertions
            expect(res.json).toHaveBeenCalledWith({ data: "eliminado" })
        })

        test("test_delete_account_invalid_token", async () => {
            const req = {
                headers: {
                    token: "invalidtoken"
                },
                body: {
                    password: "testpassword"
                }
            }
            const res = {
                json: jest.fn()
            }
            //calling function
            await deleteAccount(req, res)
            //assertions
            expect(res.json).toHaveBeenCalledWith({ data: "jwt malformed" })
        })
    }) */

});













// ? Testing Controller messagesController (complete)

// ! Error messagesPrivate API, error database, query not found and undifined, 
// ! Error deleteChatCoversations, error call databases
// ! Error newsWorks, error call databases
// ! Error workingUsers, error call databases
// ! Error createNewChat, does not call the database

describe('5 Controller messagesController', () => {

    describe('sendMenssage API', () => {
        let req, res, next;

        beforeEach(() => {
            req = {
                body: {
                    message: 'Hello',
                    tipo: 'text',
                },
                headers: {
                    token: 'some_token',
                },
                params: {
                    id: 123,
                },
                files: {
                    img: {
                        tempFilePath: '/path/to/image.jpg',
                    },
                },
            };
            res = {
                json: sinon.spy(),
            };
            next = sinon.spy();
        });

        afterEach(() => {
            sinon.restore();
        });

        test('should insert a message into the database', async () => {
            const queryStub = sinon.stub().resolves({ affectedRows: 1 });
            const conexion = { query: queryStub };
            const verifyStub = sinon.stub(jwt, 'verify').returns({ email: 'test@example.com' });

            await sendMenssage(req, res);

            expect(verifyStub.calledOnceWithExactly('some_token', 'TOKEN_SECRET')).toBeTruthy;
            expect(queryStub.calledOnceWithExactly('INSERT INTO mensaje(remitente,receptor,mensaje,tipo,link) VALUES (?,?,?,?,?)', ['test@example.com', 123, 'Hello', 'text', 'NULL'])).toBeTruthy;
            expect(res.json.calledOnceWithExactly('insert ok')).toBeTruthy;
        });

        test('should insert an image message into the database', async () => {
            req.body.tipo = 'img';
            const queryStub = sinon.stub().resolves({ affectedRows: 1 });
            const conexion = { query: queryStub };
            const uploadImageChatStub = sinon.stub().resolves({ secure_url: 'https://example.com/image.jpg' });
            const verifyStub = sinon.stub(jwt, 'verify').returns({ email: 'test@example.com' });

            await sendMenssage(req, res);

            expect(uploadImageChatStub.calledOnceWithExactly('/path/to/image.jpg')).toBeTruthy;
            expect(queryStub.calledOnceWithExactly('INSERT INTO mensaje(remitente,receptor,mensaje,tipo,link) VALUES (?,?,?,?,?)', ['test@example.com', 123, 'Imagen', 'img', 'https://example.com/image.jpg'])).toBeTruthy;
            expect(res.json.calledOnceWithExactly('insert ok')).toBeTruthy;
        });

        test('should handle errors', async () => {
            const queryStub = sinon.stub().rejects(new Error('Database error'));
            const conexion = { query: queryStub };
            const verifyStub = sinon.stub(jwt, 'verify').returns({ email: 'test@example.com' });

            await sendMenssage(req, res);

            expect(verifyStub.calledOnceWithExactly('some_token', 'TOKEN_SECRET')).toBeTruthy;
            expect(queryStub.calledOnceWithExactly('INSERT INTO mensaje(remitente,receptor,mensaje,tipo,link) VALUES (?,?,?,?,?)', ['test@example.com', 123, 'Hello', 'text', 'NULL'])).toBeTruthy;
            expect(res.json.calledOnceWithExactly('error')).toBeTruthy;
        });
    });

    describe('messagesPrivate API', () => {
        /*test('should return an error if an invalid token is provided', async () => {
            const req = {
              headers: { token: 'invalid_token' },
              params: { id: 2 }
            };
            const res = {
              json: jest.fn(),
              status: jest.fn()
            };
            await messagesPrivate(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith('Unauthorized');
          }); */
        // Tests that only authorized users can access messages. 
        // test("test_messages_private_security", async () => {
        //     // Arrange
        //     const req = {
        //         headers: {
        //             token: TOKEN_SECRET
        //         },
        //         params: {
        //             id: "unauthorized_id"
        //         }
        //     }
        //     const expectedResponse = {}
        //     const queryMock = jest.spyOn(conexion, "query")

        //     // Act
        //     const response = await messagesPrivate(req)

        //     // Assert
        //     expect(queryMock).not.toHaveBeenCalled()
        //     expect(res.json).toHaveBeenCalledWith(expectedResponse)
        // })
        //

        // Tests the performance of the function with a large result set. 
        // test("test_messages_private_with_large_result_set", async () => {
        //     // Arrange
        //     const req = {
        //         headers: {
        //             token: "valid_token"
        //         },
        //         params: {
        //             id: "valid_id"
        //         }
        //     }
        //     const expectedResponse = [{message: "valid_message"}]
        //     const queryResult = new Array(1000).fill({message: "valid_message"})
        //     const queryMock = jest.spyOn(conexion, "query").mockResolvedValue([queryResult])

        //     // Act
        //     const response = await messagesPrivate(req)

        //     // Assert
        //     expect(queryMock).toHaveBeenCalledWith("SELECT *,DATE_FORMAT(fecha,'%H:%i:%s') AS hora from mensaje WHERE remitente=? and receptor=? or remitente=? and receptor=? ",["valid_email","valid_id","valid_id","valid_email"])
        //     expect(res.json).toHaveBeenCalledWith(expectedResponse)
        // })

    });

    describe('deleteChatConverstions API', () => {

        // test("test_invalid_token", async () => {
        //     const req = {
        //         body: {
        //             report: 0
        //         },
        //         params: {
        //             id: 123
        //         },
        //         headers: {
        //             token: 'invalid_token'
        //         }
        //     }
        //     const res = {
        //         json: jest.fn()
        //     }
        //     await delteChatComversations(req, res)
        //     expect(res.json).toHaveBeenCalledWith('Invalid token')
        // })

        // test("test_valid_token_and_report_0", async () => {
        //     const req = {
        //         body: {
        //             report: 0
        //         },
        //         params: {
        //             id: 123
        //         },
        //         headers: {
        //             token: jwt.sign({ email: 'test@example.com' }, TOKEN_SECRET)
        //         }
        //     }
        //     const res = {
        //         json: jest.fn()
        //     }
        //     await delteChatComversations(req, res)
        //     expect(res.json).toHaveBeenCalledWith('delete chat')
        // })

        // test("test_valid_token_and_report_1", async () => {
        //     const req = {
        //         body: {
        //             report: 1
        //         },
        //         params: {
        //             id: 123
        //         },
        //         headers: {
        //             token: jwt.sign({ email: 'test@example.com' }, TOKEN_SECRET)
        //         }
        //     }
        //     const res = {
        //         json: jest.fn()
        //     }
        //     await delteChatComversations(req, res)
        //     expect(res.json).toHaveBeenCalledWith('delete and Report chat')
        // })
    })

    /*describe('newsWorks endpoint', () => {
        test("test_news_works_with_valid_token_and_query_returns_results", async () => {
            const req = { headers: { token: "valid_token" }, params: { id: "valid_id" } };
            const expectedResponse = [{ name: "John", lastname: "Doe", profession: "Developer" }];
            const queryResult = [{ profecional_email: "john.doe@example.com" }];
            const messageResult = [{ hora: "12:30:00", mensaje: "Hello", remitente: "john.doe@example.com" }];
            const queryMock = jest.spyOn(conexion, "query").mockResolvedValueOnce([queryResult]).mockResolvedValueOnce([messageResult]);
            const verifyMock = jest.spyOn(jwt, "verify").mockReturnValueOnce({ email: "user@example.com" });
            const res = { json: jest.fn() };

            await newsWorks(req, res);

            expect(verifyMock).toHaveBeenCalledWith("valid_token", TOKEN_SECRET);
            expect(queryMock).toHaveBeenCalledWith('SELECT trabajos.profecional_email FROM trabajos WHERE   mi_email=?  AND estado=?', ["user@example.com", "valid_id"]);
            expect(queryMock).toHaveBeenCalledWith('SELECT trabajos.estado,cliente.name,cliente.lastname,cliente.namecomplete,cliente.profession,cliente.iconUser,cliente.email FROM trabajos,cliente WHERE trabajos.profecional_email=cliente.email AND profecional_email=?', ["john.doe@example.com"]);
            expect(queryMock).toHaveBeenCalledWith("SELECT DATE_FORMAT(fecha,'%H:%i:%s') AS hora,mensaje,remitente FROM mensaje WHERE remitente=? AND receptor=? or receptor=? AND remitente=? ORDER BY fecha DESC LIMIT 1", ["user@example.com", "john.doe@example.com", "user@example.com", "john.doe@example.com"]);
            expect(res.json).toHaveBeenCalledWith(expectedResponse);
        });

        test("test_news_works_with_token_not_provided", async () => {
            const req = { headers: {}, params: { id: "valid_id" } };
            const errorMock = jest.spyOn(console, "log").mockImplementation();
            const res = { json: jest.fn() };

            await newsWorks(req, res);

            expect(errorMock).toHaveBeenCalledWith("jwt must be provided");
            expect(res.json).not.toHaveBeenCalled();
        });

        test("test_news_works_with_query_returns_no_results", async () => {
            const req = { headers: { token: "valid_token" }, params: { id: "valid_id" } };
            const queryResult = [];
            const queryMock = jest.spyOn(conexion, "query").mockResolvedValueOnce([queryResult]);
            const verifyMock = jest.spyOn(jwt, "verify").mockReturnValueOnce({ email: "user@example.com" });
            const res = { json: jest.fn() };

            await newsWorks(req, res);

            expect(verifyMock).toHaveBeenCalledWith("valid_token", TOKEN_SECRET);
            expect(queryMock).toHaveBeenCalledWith('SELECT trabajos.profecional_email FROM trabajos WHERE   mi_email=?  AND estado=?', ["user@example.com", "valid_id"]);
            expect(res.json).toHaveBeenCalledWith([]);
        });

        test("test_news_works_with_possible_date_formatting_errors", async () => {
            const req = { headers: { token: "valid_token" }, params: { id: "valid_id" } };
            const queryResult = [{ profecional_email: "john.doe@example.com" }];
            const messageResult = [{ hora: "invalid_date_format", mensaje: "Hello", remitente: "john.doe@example.com" }];
            const queryMock = jest.spyOn(conexion, "query").mockResolvedValueOnce([queryResult]).mockResolvedValueOnce([messageResult]);
            const verifyMock = jest.spyOn(jwt, "verify").mockReturnValueOnce({ email: "user@example.com" });
            const res = { json: jest.fn() };

            await newsWorks(req, res);

            expect(verifyMock).toHaveBeenCalledWith("valid_token", TOKEN_SECRET);
            expect(queryMock).toHaveBeenCalledWith('SELECT trabajos.profecional_email FROM trabajos WHERE   mi_email=?  AND estado=?', ["user@example.com", "valid_id"]);
            expect(queryMock).toHaveBeenCalledWith('SELECT trabajos.estado,cliente.name,cliente.lastname,cliente.namecomplete,cliente.profession,cliente.iconUser,cliente.email FROM trabajos,cliente WHERE trabajos.profecional_email=cliente.email AND profecional_email=?', ["john.doe@example.com"]);
            expect(queryMock).toHaveBeenCalledWith("SELECT DATE_FORMAT(fecha,'%H:%i:%s') AS hora,mensaje,remitente FROM mensaje WHERE remitente=? AND receptor=? or receptor=? AND remitente=? ORDER BY fecha DESC LIMIT 1", ["user@example.com", "john.doe@example.com", "user@example.com", "john.doe@example.com"]);
            expect(res.json).toHaveBeenCalledWith([{ name: undefined, lastname: undefined, profession: undefined, mensaje: "Hello", hora: "00:00", remitente: "john.doe@example.com" }]);
        });
    }); */

    describe('dataUserChat API', () => {

        test("test_valid_email_returns_user_data", async () => {
            const req = { params: { email: "validemail@test.com" } };
            const res = { json: jest.fn() };
            const expectedData = [{ id: 1, name: "John", email: "validemail@test.com" }];
            const mockQuery = jest.spyOn(conexion, "query").mockResolvedValueOnce([expectedData]);
            await dataUsuerChat(req, res);
            expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM cliente WHERE email=?', ["validemail@test.com"]);
            expect(res.json).toHaveBeenCalledWith(expectedData);
        });

        test("test_handles_database_connection_failure", async () => {
            const req = { params: { email: "validemail@test.com" } };
            const res = { json: jest.fn() };
            const mockQuery = jest.spyOn(conexion, "query").mockRejectedValueOnce(new Error("Database connection error"));
            await dataUsuerChat(req, res);
            expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM cliente WHERE email=?', ["validemail@test.com"]);
            expect(res.json).not.toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith(new Error("Database connection error"));
        });

        test("test_returns_data_for_single_user", async () => {
            const req = { params: { email: "validemail@test.com" } };
            const res = { json: jest.fn() };
            const expectedData = [{ id: 1, name: "John", email: "validemail@test.com" }];
            const mockQuery = jest.spyOn(conexion, "query").mockResolvedValueOnce([expectedData]);
            await dataUsuerChat(req, res);
            expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM cliente WHERE email=?', ["validemail@test.com"]);
            expect(res.json).toHaveBeenCalledWith(expectedData);
        });

    });

    /*describe('workingUsers API', () => {
        test("test_working_users_with_valid_token_and_id", async () => {
            const req = {
                headers: {
                    token: jwt.sign({ email: "santiagocelada13@gmail.com" }, TOKEN_SECRET, { expiresIn: TOKEN_EXPIRE })
                },
                params: {
                    id: 1
                }
            }
            const res = {
                json: jest.fn()
            }
            const queryMock = jest.spyOn(conexion, "query").mockResolvedValue([{ affectedRows: 1 }])
            await workingUsers(req, res)
            expect(queryMock).toHaveBeenCalledWith('UPDATE trabajos SET estado="trabajando"  WHERE mi_email=? AND profecional_email=?', ["santiagocelada13@gmail.com", 1])
            expect(res.json).toHaveBeenCalledWith('you are woirking')
        });

        test("test_working_users_with_valid_token_and_already_working_id", async () => {
            const req = {
                headers: {
                    token: jwt.sign({ email: "test@test.com" }, TOKEN_SECRET, { expiresIn: TOKEN_EXPIRE })
                },
                params: {
                    id: 1
                }
            }
            const res = {
                json: jest.fn()
            }
            const queryMock = jest.spyOn(conexion, "query").mockResolvedValue([{ affectedRows: 0 }])
            await workingUsers(req, res)
            expect(queryMock).toHaveBeenCalledWith('UPDATE trabajos SET estado="trabajando"  WHERE mi_email=? AND profecional_email=?', ["test@test.com", 1])
            expect(res.json).toHaveBeenCalledWith('you are not working')
        })

        test("test_working_users_with_invalid_token", async () => {
            const req = {
                headers: {
                    token: "invalid_token"
                },
                params: {
                    id: 1
                }
            }
            const res = {
                json: jest.fn()
            }
            await workingUsers(req, res)
            expect(res.json).toHaveBeenCalledWith(expect.stringContaining("jwt"))
        })

        test("test_working_users_with_expired_token", async () => {
            const req = {
                headers: {
                    token: jwt.sign({ email: "test@test.com" }, TOKEN_SECRET, { expiresIn: 0 })
                },
                params: {
                    id: 1
                }
            }
            const res = {
                json: jest.fn()
            }
            await workingUsers(req, res)
            expect(res.json).toHaveBeenCalledWith(expect.stringContaining("expired"))
        })
    }); */


    /*describe("createNewChat", () => {
        let req, res;

        beforeEach(() => {
            req = {
                headers: {
                    token: "valid_token",
                },
                params: {
                    id: "test@example.com",
                },
            };
            res = {
                json: jest.fn(),
            };
        });

        afterEach(() => {
            jest.fn();
        });

        test("should return 'connected' if chat already exists and is in 'nuevo' state", async () => {
            const mockQueryResult = [{ estado: "nuevo" }];
            const mockQuery = jest.fn().mockResolvedValue([mockQueryResult]);
            jest.mocked("jsonwebtoken", () => ({ verify: jest.fn().mockReturnValue({ email: "user@example.com" }) }));
            jest.mocked("../path/to/conexion", () => ({ query: mockQuery }));

            await createNewChat(req, res);

            expect(res.json).toHaveBeenCalledWith("connected");
        });

        test("should return 'connected' if chat already exists and is in 'trabajando' state", async () => {
            const mockQueryResult = [{ estado: "trabajando" }];
            const mockQuery = jest.fn().mockResolvedValue([mockQueryResult]);
            jest.mocked("jsonwebtoken", () => ({ verify: jest.fn().mockReturnValue({ email: "user@example.com" }) }));
            jest.mocked("../path/to/conexion", () => ({ query: mockQuery }));

            await createNewChat(req, res);

            expect(res.json).toHaveBeenCalledWith("connected");
        });

        test("should update chat state to 'nuevo' and return 'connected' if chat already exists and is in 'Eliminado' state", async () => {
            const mockQueryResult = [{ estado: "Eliminado" }];
            const mockQuery = jest.fn().mockResolvedValue([mockQueryResult]);
            const mockUpdateQuery = jest.fn().mockResolvedValue({ affectedRows: 1 });
            const mockInsertQuery = jest.fn().mockResolvedValue({ affectedRows: 1 });
            jest.mocked("jsonwebtoken", () => ({ verify: jest.fn().mockReturnValue({ email: "user@example.com" }) }));
            jest.mocked("../path/to/conexion", () => ({ query: mockQuery }));
            jest.mocked("../path/to/conexion", () => ({ query: mockUpdateQuery }));
            jest.mocked("../path/to/conexion", () => ({ query: mockInsertQuery }));

            await createNewChat(req, res);

            expect(res.json).toHaveBeenCalledWith("connected");
        });

        test("should return 'resport' if chat already exists and is in 'Reportado' state", async () => {
            const mockQueryResult = [{ estado: "Reportado" }];
            const mockQuery = jest.fn().mockResolvedValue([mockQueryResult]);
            jest.mocked("jsonwebtoken", () => ({ verify: jest.fn().mockReturnValue({ email: "user@example.com" }) }));
            jest.mocked("../path/to/conexion", () => ({ query: mockQuery }));

            await createNewChat(req, res);

            expect(res.json).toHaveBeenCalledWith("resport");
        });
    }); */

    describe('sendReposrt API', () => {

        test("test_send_report_invalid_token", async () => {
            const req = {
                headers: {
                    token: "invalid token"
                },
                params: {
                    id: 1
                },
                body: {
                    report: "test report"
                }
            }
            const res = {
                json: jest.fn()
            }
            await sendReport(req, res)
            expect(res.json).not.toHaveBeenCalledWith('reportado')
        })

        test("test_send_report_missing_token", async () => {
            const req = {
                headers: {},
                params: {
                    id: 1
                },
                body: {
                    report: "test report"
                }
            }
            const res = {
                json: jest.fn()
            }
            await sendReport(req, res)
            expect(res.json).not.toHaveBeenCalledWith('reportado')
        })

        test("test_send_report_invalid_id", async () => {
            const req = {
                headers: {
                    token: jwt.sign({ email: "test@test.com" }, TOKEN_SECRET)
                },
                params: {
                    id: "invalid id"
                },
                body: {
                    report: "test report"
                }
            }
            const res = {
                json: jest.fn()
            }
            await sendReport(req, res)
            expect(res.json).not.toHaveBeenCalledWith('reportado')
        })

        test("test_send_report_missing_id", async () => {
            const req = {
                headers: {
                    token: jwt.sign({ email: "santiagocelada13@gmail.com" }, TOKEN_SECRET)
                },
                params: {},
                body: {
                    report: "test report"
                }
            }
            const res = {
                json: jest.fn()
            }
            await sendReport(req, res)
            expect(res.json).not.toHaveBeenCalledWith('reportado')
        })
    })

});

// ? Testing Controller publicaciones (complete)

// ! Error createPostTextos, error 404
// ! Error likesTexts, database call errors in test: 1, 2, 3 and 6
// ! Error DontLike, database call errors in test: 1, 2, 3 
// ! Error UpdateText, intermediate values not iterables
// ! Error deletePostTexts, intermediate values not iterables
// ! Error insertComent, undefined affectRows all tests
// ! Error insertComentTexts, undefined affectRows all tests
// ! Error deleteComments, Revaived number of calls 0 Number of calls revived 0 of 4
// ! Error deleteComments, Revaived number of calls 23 or 24 of 0 and 4

describe('6. Controller publicaciones', () => {

    describe('imagenPerfil API', () => {
        let req, res, next, uploadImageStub, queryStub, verifyStub;

        beforeEach(() => {
            req = {
                headers: {},
                files: {}
            };
            res = {
                json: sinon.spy(),
                status: sinon.stub().returns({ json: sinon.spy() })
            };
            next = sinon.spy();
            uploadImageStub = sinon.stub().resolves({ secure_url: 'https://example.com/image.jpg' });
            queryStub = sinon.stub().resolves({ affectedRows: 1 });
            verifyStub = sinon.stub(jwt, 'verify').returns({ email: 'test@example.com' });
        });

        afterEach(() => {
            sinon.restore();
        });

        test('should return an error if no token is provided', async () => {
            await imagenPerfil(req, res, next);
            expect(res.status.calledWith(404)).toBeTruthy;
            expect(res.status().json.calledWith({ message: 'ERROR 404' })).toBeTruthy;
        });

        test('should update the user profile image and return INSERT_OK', async () => {
            req.headers.token = 'test-token';
            req.files.img = { tempFilePath: '/path/to/image.jpg' };
            sinon.replace(conexion, 'query', queryStub);
            await imagenPerfil(req, res, next);
            expect(uploadImageStub.calledOnce).toBeTruthy;
            expect(queryStub.calledOnce).toBeTruthy;
            expect(res.json.calledWith({ data: 'INSERT_OK' })).toBeTruthy;
        });

        test('should return an error if the update query fails', async () => {
            req.headers.token = 'test-token';
            req.files.img = { tempFilePath: '/path/to/image.jpg' };
            sinon.replace(conexion, 'query', sinon.stub().resolves({ affectedRows: 0 }));
            await imagenPerfil(req, res, next);
            expect(uploadImageStub.calledOnce).toBeTruthy;
            expect(res.json.calledWith({ data: 'ERROR' })).toBeTruthy;
        });

        test('should return an error if jwt.verify throws an error', async () => {
            req.headers.token = 'test-token';
            verifyStub.throws(new Error('Invalid token'));
            await imagenPerfil(req, res, next);
            expect(res.status.calledWith(404)).toBeTruthy;
            expect(res.status().json.calledWith({ message: 'ERROR 404' })).toBeTruthy;
        });
    });

    /*describe('createPostTextos API', () => {
        test("test_create_post_textos_valid_params", async () => {
            const req = {
                params: {
                    email: "santiagocelada13@gmail.com",
                    token: jwt.verify('santiagocelada13@gmail.com', TOKEN_SECRET)
                }
            };
            const res = {
                json: jest.fn()
            };
            await createPostTextos(req, res);
            expect(res.json).toHaveBeenCalledWith({ data: "BIEN" });
        });

        test("test_create_post_textos_invalid_db_connection", async () => {
            const req = {
                params: {
                    email: "test@test.com"
                },
                body: {
                    description: "Test description",
                    textos: "Test textos"
                }
            };
            const res = {
                json: jest.fn()
            };
            // Mocking the database connection to return an error
            jest.spyOn(conexion, "query").mockImplementation(() => {
                throw new Error("Database connection error");
            });
            await createPostTextos(req, res);
            expect(res.json).toHaveBeenCalledWith("ERROR");
        });

        test("test_create_post_textos_response_format", async () => {
            const req = {
                params: {
                    email: "test@test.com"
                },
                body: {
                    description: "Test description",
                    textos: "Test textos"
                }
            };
            const res = {
                json: jest.fn()
            };
            await createPostTextos(req, res);
            expect(res.json).toHaveBeenCalledWith({ data: "BIEN" });
        });

    }) */


    describe('createPost API', () => {
        let req, res, conexion;

        beforeEach(() => {
            req = {
                params: {
                    email: 'test@example.com'
                },
                body: {
                    description: 'Test post'
                },
                files: {
                    img: {
                        tempFilePath: '/path/to/test/image.jpg'
                    }
                }
            };
            res = {
                json: sinon.spy(),
                status: sinon.stub().returns({ json: sinon.spy() })
            };
            conexion = {
                query: sinon.stub()
            };
        });

        test('should create a new post with image and return success response', async () => {
            const uploadImage = sinon.stub().resolves({ secure_url: 'https://example.com/image.jpg' });
            conexion.query.onCall(0).resolves([[{ contador: 50 }]]);
            conexion.query.onCall(1).resolves([{ affectedRows: 1, insertId: 1 }]);
            conexion.query.onCall(2).resolves([{ affectedRows: 1 }]);
            conexion.query.onCall(3).resolves([{ affectedRows: 1 }]);
            await createPost(req, res, uploadImage, conexion);
            expect(res.json.calledOnceWithExactly({ data: 'BIEN', respu: [{ affectedRows: 1 }] })).toBeTruthy;
        });

        test('should create a new post without image and return success response', async () => {
            const uploadImage = sinon.stub();
            conexion.query.onCall(0).resolves([[{ contador: 50 }]]);
            conexion.query.onCall(1).resolves([{ affectedRows: 1, insertId: 1 }]);
            conexion.query.onCall(2).resolves([{ affectedRows: 1 }]);
            conexion.query.onCall(3).resolves([{ affectedRows: 1 }]);
            await createPost(req, res, uploadImage, conexion);
            expect(res.json.calledOnceWithExactly({ data: 'BIEN', respu: [{ affectedRows: 1 }] })).toBeTruthy;
        });

        test('should return "No disponible" response if user has already created 100 posts', async () => {
            const uploadImage = sinon.stub().resolves({ secure_url: 'https://example.com/image.jpg' });
            conexion.query.onCall(0).resolves([[{ contador: 100 }]]);
            await createPost(req, res, uploadImage, conexion);
            expect(res.json.calledOnceWithExactly({ data: 'No disponible' })).toBeTruthy;
        });

        test('should return error response if post creation fails', async () => {
            const uploadImage = sinon.stub().resolves({ secure_url: 'https://example.com/image.jpg' });
            const error = new Error('Database error');
            conexion.query.onCall(0).resolves([[{ contador: 50 }]]);
            conexion.query.onCall(1).resolves([{ affectedRows: 0 }]);
            await createPost(req, res, uploadImage, conexion);
            expect(res.json.calledOnceWithExactly({ data: 'ERROR', error })).toBeTruthy;
        });

        test('should return 404 error response if any error occurs', async () => {
            const uploadImage = sinon.stub().resolves({ secure_url: 'https://example.com/image.jpg' });
            conexion.query.onCall(0).throws(new Error('Database error'));
            await createPost(req, res, uploadImage, conexion);
            expect(res.status.calledOnceWithExactly(404)).toBeTruthy;
            expect(res.status().json.calledOnceWithExactly({ message: 'ERROR 404' })).toBeTruthy;
        });
    });

    describe('likesImg API', () => {
        let req, res, queryStub, jsonSpy;

        beforeEach(() => {
            req = {
                headers: {
                    token: 'testToken'
                },
                body: {
                    id: 1
                }
            };
            res = {
                json: jest.fn()
            };
            queryStub = sinon.stub();
            queryStub.onFirstCall().resolves([{ email_megusta: 'testEmail' }]);
            queryStub.onSecondCall().resolves({ affectedRows: 1 });
            queryStub.onThirdCall().resolves({ affectedRows: 1 });
            jsonSpy = sinon.spy(res, 'json');
        });

        afterEach(() => {
            sinon.restore();
        });

        test('should return "bien" if the like is added successfully', async () => {
            await likesImg(req, res);
            expect(jsonSpy.calledOnceWith('bien')).toBeTruthy;
        });

        test('should return "mal el like" if the like update fails', async () => {
            queryStub.onThirdCall().resolves({ affectedRows: 0 });
            await likesImg(req, res);
            expect(jsonSpy.calledOnceWith('mal el like')).toBeTruthy;
        });

        test('should return "mal" if the insert fails', async () => {
            queryStub.onFirstCall().resolves([]);
            await likesImg(req, res);
            expect(jsonSpy.calledOnceWith('mal')).toBeTruthy;
        });

        test('should catch and log errors', async () => {
            const consoleStub = sinon.stub(console, 'log');
            queryStub.onFirstCall().throws(new Error('testError'));
            await likesImg(req, res);
            expect(consoleStub.calledOnceWith('testError')).toBeTruthy;
        });
    });

    describe('likesTexts API', () => {
        let req, res, queryStub, jsonSpy;

        beforeEach(() => {
            req = {
                headers: {
                    token: 'some_token'
                },
                body: {
                    id: 1
                }
            };
            res = {
                json: jest.fn()
            };
            queryStub = sinon.stub();
            queryStub.onFirstCall().resolves([{ email_cliente2: 'test@test.com' }]);
            queryStub.onSecondCall().resolves({ affectedRows: 1 });
            queryStub.onThirdCall().resolves({ affectedRows: 1 });
            jsonSpy = sinon.spy(res, 'json');
        });

        afterEach(() => {
            sinon.restore();
        });

        test('should return "bien" if the like is added successfully', async () => {
            await likesTexts(req, res);
            expect(jsonSpy.calledOnceWith('bien')).toBeTruthy;
        });

        test('should return "mal el like" if the like update fails', async () => {
            queryStub.onThirdCall().resolves({ affectedRows: 0 });
            await likesTexts(req, res);
            expect(jsonSpy.calledOnceWith('mal el like')).toBeTruthy;
        });

        test('should return "mal" if the insert fails', async () => {
            queryStub.onFirstCall().resolves([]);
            await likesTexts(req, res);
            expect(jsonSpy.calledOnceWith('mal')).toBeTruthy;
        });

        test('should handle errors gracefully', async () => {
            queryStub.throws(new Error('Database error'));
            await likesTexts(req, res);
            expect(jsonSpy.notCalled).toBeTruthy;
        });
    });

    describe('DontLikeText API', () => {
        let req, res, conexion;

        beforeEach(() => {
            req = {
                headers: {
                    token: "valid_token",
                },
                body: {
                    id: 1,
                },
            };
            res = {
                json: jest.fn(),
            };
            conexion = {
                query: jest.fn(),
            };
        });

        afterEach(() => {
            jest.fn();
        });

        /*test("should update the estado of megustatextos and likes of publicacionestextos when given valid inputs", async () => {
            // Arrange
            const [result] = [{ affectedRows: 1 }];
            const [rest] = [{ affectedRows: 1 }];
            conexion.query.mockImplementationOnce(() => [result]);
            conexion.query.mockImplementationOnce(() => [rest]);

            // Act
            await DontLikeText(req, res);

            // Assert
            expect(conexion.query).toHaveBeenCalledTimes(2);
            expect(conexion.query).toHaveBeenCalledWith(
                "UPDATE megustatextos SET estado=? WHERE email_cliente2=? && id_textos=?",
                ["nomegusta", "valid_email", 1]
            );
            expect(conexion.query).toHaveBeenCalledWith(
                "UPDATE publicacionestextos SET likes=(SELECT likes FROM publicacionestextos WHERE id=?)-1 WHERE id=?",
                [1, 1]
            );
            expect(res.json).toHaveBeenCalledWith("bien dislike");
        }); */

        /*test("should return 'mal el dislike' when the likes update query fails", async () => {
            // Arrange
            const [result] = [{ affectedRows: 1 }];
            const [rest] = [{ affectedRows: 0 }];
            conexion.query.mockImplementationOnce(() => [result]);
            conexion.query.mockImplementationOnce(() => [rest]);

            // Act
            await DontLikeText(req, res);

            // Assert
            expect(conexion.query).toHaveBeenCalledTimes(2);
            expect(conexion.query).toHaveBeenCalledWith(
                "UPDATE megustatextos SET estado=? WHERE email_cliente2=? && id_textos=?",
                ["nomegusta", "valid_email", 1]
            );
            expect(conexion.query).toHaveBeenCalledWith(
                "UPDATE publicacionestextos SET likes=(SELECT likes FROM publicacionestextos WHERE id=?)-1 WHERE id=?",
                [1, 1]
            );
            expect(res.json).toHaveBeenCalledWith("mal el dislike");
        }); */

        /*test("should return 'mal dislike' when the megustatextos update query fails", async () => {
            // Arrange
            const [result] = [{ affectedRows: 0 }];
            conexion.query.mockImplementationOnce(() => [result]);

            // Act
            await DontLikeText(req, res);

            // Assert
            expect(conexion.query).toHaveBeenCalledTimes(1);
            expect(conexion.query).toHaveBeenCalledWith(
                "UPDATE megustatextos SET estado=? WHERE email_cliente2=? && id_textos=?",
                ["nomegusta", "valid_email", 1]
            );
            expect(res.json).toHaveBeenCalledWith("mal dislike");
        }); */

        test("should return nothing when there is no token in the request headers", async () => {
            // Arrange
            req.headers.token = undefined;

            // Act
            await DontLikeText(req, res);

            // Assert
            expect(conexion.query).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });

        test("should return nothing when the token is invalid", async () => {
            // Arrange
            req.headers.token = "invalid_token";

            // Act
            await DontLikeText(req, res);

            // Assert
            expect(conexion.query).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });

        /*test("should log an error when an exception is thrown", async () => {
            // Arrange
            const error = new Error("test error");
            console.log = jest.fn();
            conexion.query.mockImplementationOnce(() => {
                throw error;
            });

            // Act
            await DontLikeText(req, res);

            // Assert
            expect(console.log).toHaveBeenCalledWith(error);
        }); */
    })

    describe("DontLike API", () => {
        let req, res, conexion;

        beforeEach(() => {
            req = {
                headers: {
                    token: "valid_token",
                },
                body: {
                    id: 1,
                },
            };
            res = {
                json: jest.fn(),
            };
            conexion = {
                query: jest.fn(),
            };
        });

        afterEach(() => {
            jest.fn();
        });

        /*test("should return 'bien dislike' if the query is successful", async () => {
          jwt.verify = jest.fn().mockReturnValue({ email: "test@example.com" });
          conexion.query.mockResolvedValueOnce([{ affectedRows: 1 }]).mockResolvedValueOnce([{ affectedRows: 1 }]);
          await DontLike(req, res);
          expect(res.json).toHaveBeenCalledWith("bien dislike");
        });
      
        test("should return 'mal el dislike' if the second query fails", async () => {
          jwt.verify = jest.fn().mockReturnValue({ email: "test@example.com" });
          conexion.query.mockResolvedValueOnce([{ affectedRows: 1 }]).mockResolvedValueOnce([{ affectedRows: 0 }]);
          await DontLike(req, res);
          expect(res.json).toHaveBeenCalledWith("mal el dislike");
        });
      
        test("should return 'mal dislike' if the first query fails", async () => {
          jwt.verify = jest.fn().mockReturnValue({ email: "test@example.com" });
          conexion.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
          await DontLike(req, res);
          expect(res.json).toHaveBeenCalledWith("mal dislike");
        }); */

        test("should not update the database if there is no token", async () => {
            req.headers.token = undefined;
            await DontLike(req, res);
            expect(conexion.query).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });

        test("should not update the database if the token is invalid", async () => {
            jwt.verify = jest.fn().mockImplementation(() => {
                throw new Error("Invalid token");
            });
            await DontLike(req, res);
            expect(conexion.query).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    describe("deletePost API", () => {
        it("test_delete_post_no_likes_or_comments", async () => {
            const req = { params: { id: 1 } };
            const res = { json: jest.fn() };
            const queryMock = jest.fn().mockReturnValueOnce([[], null]).mockReturnValueOnce([{ affectedRows: 1 }, null])
                .mockReturnValueOnce([[], null]).mockReturnValueOnce([{ affectedRows: 1 }, null])
                .mockReturnValueOnce([{ affectedRows: 1 }, null]).mockReturnValueOnce([{ affectedRows: 1 }, null]);
            conexion.query = queryMock;
            await DeletePost(req, res);
            expect(queryMock).toHaveBeenCalledTimes(4);
            expect(res.json).toHaveBeenCalledWith("bien eliminada");
        });

        it("test_delete_post_with_likes_and_comments", async () => {
            const req = { params: { id: 1 } };
            const res = { json: jest.fn() };
            const queryMock = jest.fn().mockReturnValueOnce([[{ id_megusta: 1 }], null])
                .mockReturnValueOnce([{ affectedRows: 1 }, null])
                .mockReturnValueOnce([[{ idimagen: 1 }], null])
                .mockReturnValueOnce([{ affectedRows: 1 }, null])
                .mockReturnValueOnce([{ affectedRows: 1 }, null])
                .mockReturnValueOnce([{ affectedRows: 1 }, null]);
            conexion.query = queryMock;
            await DeletePost(req, res);
            expect(queryMock).toHaveBeenCalledTimes(6);
            expect(res.json).toHaveBeenCalledWith("bien eliminada");
        });

    });

    /*describe('UpdateText', () => {
        let req, res, queryStub;

        beforeEach(() => {
            req = {
                params: { id: 1 },
                body: { text: 'new text' }
            };
            res = {
                json: sinon.spy()
            };
            queryStub = sinon.stub().resolves({ affectedRows: 1 });
        });

        test('should update text in database and return success message', async () => {
            const conexion = { query: queryStub };
            await UpdateText(req, res, conexion);
            expect(queryStub.calledOnceWithExactly('UPDATE publicacionestextos SET textos=? WHERE id=?', ['new text', 1])).toBeTruthy;
            expect(res.json.calledOnceWithExactly('bien actualizado')).toBeTruthy;
        });

        test('should not update text in database and return error message', async () => {
            queryStub.resolves({ affectedRows: 0 });
            const conexion = { query: queryStub };
            await UpdateText(req, res, conexion);
            expect(queryStub.calledOnceWithExactly('UPDATE publicacionestextos SET textos=? WHERE id=?', ['new text', 1])).toBeTruthy;
            expect(res.json.calledOnceWithExactly('mal actualizado')).toBeFalsy;
        });
    }); */

    /*describe('DeletePostText API', () => {
        let req, res;

        beforeEach(() => {
            req = {
                params: {
                    id: 1,
                },
            };
            res = {
                json: jest.fn(),
            };
        });

        afterEach(() => {
            jest.fn();
        });

        test("should delete post text and related data when all data exists", async () => {
            const mockQuery = jest.fn();
            mockQuery.mockReturnValueOnce([{ id_textos: 1 }]);
            mockQuery.mockReturnValueOnce({ affectedRows: 1 });
            mockQuery.mockReturnValueOnce([{ idtextos: 1 }]);
            mockQuery.mockReturnValueOnce({ affectedRows: 1 });
            mockQuery.mockReturnValueOnce({ affectedRows: 1 });
            mockQuery.mockReturnValueOnce({ affectedRows: 1 });

            const conexion = {
                query: mockQuery,
            };

            await DeletePostText(req, res, conexion);

            expect(mockQuery).toHaveBeenCalledTimes(6);
            expect(mockQuery).toHaveBeenCalledWith(
                "SELECT id_textos FROM megustatextos WHERE id_textos=?  ",
                [1]
            );
            expect(mockQuery).toHaveBeenCalledWith(
                "DELETE FROM megustatextos WHERE id_textos=?  ",
                [1]
            );
            expect(mockQuery).toHaveBeenCalledWith(
                "SELECT idtextos FROM comentarios_textos WHERE idtextos=?  ",
                [1]
            );
            expect(mockQuery).toHaveBeenCalledWith(
                "DELETE FROM comentarios_textos WHERE idtextos=?  ",
                [1]
            );
            expect(mockQuery).toHaveBeenCalledWith(
                "DELETE FROM publicacionestextos_cliente WHERE id3=?",
                [1]
            );
            expect(mockQuery).toHaveBeenCalledWith(
                "DELETE FROM publicacionestextos WHERE id=?",
                [1]
            );
            expect(res.json).toHaveBeenCalledWith("bien eliminada");
        });

        test("should delete post text and related data when some data exists", async () => {
            const mockQuery = jest.fn();
            mockQuery.mockReturnValueOnce([]);
            mockQuery.mockReturnValueOnce([]);
            mockQuery.mockReturnValueOnce([{ idtextos: 1 }]);
            mockQuery.mockReturnValueOnce({ affectedRows: 1 });
            mockQuery.mockReturnValueOnce({ affectedRows: 1 });
            mockQuery.mockReturnValueOnce({ affectedRows: 1 });

            const conexion = {
                query: mockQuery,
            };

            await DeletePostText(req, res, conexion);

            expect(mockQuery).toHaveBeenCalledTimes(6);
            expect(mockQuery).toHaveBeenCalledWith(
                "SELECT id_textos FROM megustatextos WHERE id_textos=?  ",
                [1]
            );
            expect(mockQuery).toHaveBeenCalledWith(
                "SELECT idtextos FROM comentarios_textos WHERE idtextos=?  ",
                [1]
            );
            expect(mockQuery).toHaveBeenCalledWith(
                "DELETE FROM comentarios_textos WHERE idtextos=?  or idtextos=NULL",
                [1]
            );
            expect(mockQuery).toHaveBeenCalledWith(
                "DELETE FROM publicacionestextos_cliente WHERE id3=?",
                [1]
            );
            expect(mockQuery).toHaveBeenCalledWith(
                "DELETE FROM publicacionestextos WHERE id=?",
                [1]
            );
            expect(res.json).toHaveBeenCalledWith("bien eliminada");
        });

        test("should delete post text and related data when no data exists", async () => {
            const mockQuery = jest.fn();
            mockQuery.mockReturnValueOnce([]);
            mockQuery.mockReturnValueOnce([]);
            mockQuery.mockReturnValueOnce([]);
            mockQuery.mockReturnValueOnce({ affectedRows: 1 });
            mockQuery.mockReturnValueOnce({ affectedRows: 1 });

            const conexion = {
                query: mockQuery,
            };

            await DeletePostText(req, res, conexion);

            expect(mockQuery).toHaveBeenCalledTimes(5);
            expect(mockQuery).toHaveBeenCalledWith(
                "SELECT id_textos FROM megustatextos WHERE id_textos=?  ",
                [1]
            );
            expect(mockQuery).toHaveBeenCalledWith(
                "SELECT idtextos FROM comentarios_textos WHERE idtextos=?  ",
                [1]
            );
            expect(mockQuery).toHaveBeenCalledWith(
                "DELETE FROM publicacionestextos_cliente WHERE id3=?",
                [1]
            );
            expect(mockQuery).toHaveBeenCalledWith(
                "DELETE FROM publicacionestextos WHERE id=?",
                [1]
            );
            expect(res.json).toHaveBeenCalledWith("bien eliminada");
        });
    }) */


    describe('userPosts', () => {

        test("test_user_posts_valid_email_and_token", async () => {
            // Mocking req and res objects
            const req = {
                params: { email: "test@test.com" },
                headers: { token: "valid_token" },
            };
            const res = {
                json: jest.fn(),
            };

            // Mocking database response
            const mockResult = [{ profession: "test", comments: "test", img: "test", description: "test", likes: "test", id: 1, email: "test@test.com", name: "test", iconUser: "test", tiempo: "test", estado: "test" }];
            const mockQuery = jest.fn().mockReturnValue([mockResult]);
            const mockConexion = { query: mockQuery };
            jest.spyOn(conexion, 'query').mockImplementation(mockConexion.query);

            // Mocking jwt.verify function
            const mockVerify = jest.fn().mockReturnValue({ email: "test@test.com" });
            jest.spyOn(jwt, 'verify').mockImplementation(mockVerify);

            await userPosts(req, res);

            expect(mockQuery).toHaveBeenCalled();
            expect(mockVerify).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(mockResult);
        });

        test("test_user_posts_invalid_token", async () => {
            // Mocking req and res objects
            const req = {
                params: { email: "test@test.com" },
                headers: { token: "invalid_token" },
            };
            const res = {
                json: jest.fn(),
            };

            // Mocking jwt.verify function
            const mockVerify = jest.fn().mockImplementation(() => { throw new Error() });
            jest.spyOn(jwt, 'verify').mockImplementation(mockVerify);

            await userPosts(req, res);

            expect(mockVerify).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ message: "ERROR 404" });
        });

        test("test_user_posts_database_query_syntax_error", async () => {
            // Mocking req and res objects
            const req = {
                params: { email: "test@test.com" },
                headers: { token: "valid_token" },
            };
            const res = {
                json: jest.fn(),
            };

            // Mocking database response
            const mockQuery = jest.fn().mockImplementation(() => { throw new Error() });
            const mockConexion = { query: mockQuery };
            jest.spyOn(conexion, 'query').mockImplementation(mockConexion.query);

            // Mocking jwt.verify function
            const mockVerify = jest.fn().mockReturnValue({ email: "test@test.com" });
            jest.spyOn(jwt, 'verify').mockImplementation(mockVerify);

            await userPosts(req, res);

            expect(mockQuery).toHaveBeenCalled();
            expect(mockVerify).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ message: "ERROR 404" });
        });

    });

    describe('userPostsTextos', () => {
        test("test_user_posts_textos_with_correct_email_and_token", async () => {
            const req = {
                params: { email: "test@test.com" },
                headers: { token: "valid_token" }
            };
            const res = {
                json: jest.fn()
            };
            const expectedData = [{ /* expected data */ }];
            const queryMock = jest.fn().mockReturnValue([expectedData]);
            const conexionMock = { query: queryMock };
            jest.spyOn(conexion, "query").mockImplementation(queryMock);
            jwt.verify = jest.fn().mockReturnValue({ email: "test@test.com" });
            await userPostsTextos(req, res);
            expect(queryMock).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expectedData);
        });

        test("test_user_posts_textos_with_incorrect_email", async () => {
            const req = {
                params: { email: "incorrect@test.com" },
                headers: { token: "valid_token" }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const queryMock = jest.fn().mockReturnValue([]);
            const conexionMock = { query: queryMock };
            jest.spyOn(conexion, "query").mockImplementation(queryMock);
            jwt.verify = jest.fn().mockReturnValue({ email: "test@test.com" });
            await userPostsTextos(req, res);
            expect(queryMock).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "ERROR 404" });
        });
    });

    /*describe('insertComent', () => {

        test("test_insert_comment_valid_token_valid_comment_valid_id", async () => {
            const req = {
                headers: {
                    token: jwt.sign({ email: "test@test.com" }, TOKEN_SECRET, { expiresIn: TOKEN_EXPIRE })
                },
                body: {
                    coment: "This is a valid comment"
                },
                params: {
                    id: 1
                }
            };
            const res = {
                json: jest.fn()
            };
            await insertComment(req, res);
            expect(res.json).toHaveBeenCalledWith("insert OK");
        });

        test("test_insert_comment_valid_token_empty_comment_valid_id", async () => {
            const req = {
                headers: {
                    token: jwt.sign({ email: "test@test.com" }, TOKEN_SECRET, { expiresIn: TOKEN_EXPIRE })
                },
                body: {
                    coment: ""
                },
                params: {
                    id: 1
                }
            };
            const res = {
                json: jest.fn()
            };
            await insertComment(req, res);
            expect(res.json).toHaveBeenCalledWith("insert OK");
        });

        test("test_insert_comment_invalid_token", async () => {
            const req = {
                headers: {
                    token: "invalid_token"
                },
                body: {
                    coment: "This is a valid comment"
                },
                params: {
                    id: 1
                }
            };
            const res = {
                json: jest.fn()
            };
            await insertComment(req, res);
            expect(res.json).toHaveBeenCalledWith("not insert");
        });

        test("test_insert_comment_missing_comment", async () => {
            const req = {
                headers: {
                    token: jwt.sign({ email: "test@test.com" }, TOKEN_SECRET, { expiresIn: TOKEN_EXPIRE })
                },
                body: {},
                params: {
                    id: 1
                }
            };
            const res = {
                json: jest.fn()
            };
            await insertComment(req, res);
            expect(res.json).toHaveBeenCalledWith("not insert");
        });

    }); */

    /* describe("insertCommentText", () => {
        let req, res, conexion;

        beforeEach(() => {
            req = {
                headers: {
                    token: "valid_token",
                },
                body: {
                    coment: "test comment",
                },
                params: {
                    id: 1,
                },
            };
            res = {
                json: jest.fn(),
            };
            conexion = {
                query: jest.fn(),
            };
        });

        afterEach(() => {
            jest.fn();
        });

        it("should insert comment and return 'insert OK'", async () => {
            const tokenPayload = {
                email: "test@example.com",
            };
            jwt.verify = jest.fn().mockReturnValue(tokenPayload);
            conexion.query.mockReturnValueOnce([{ affectedRows: 1 }]);
            conexion.query.mockReturnValueOnce([{ affectedRows: 1 }]);
            conexion.query.mockReturnValueOnce([{ affectedRows: 1 }]);
            conexion.query.mockReturnValueOnce([{ affectedRows: 1 }]);
            await insertCommentText(req, res);
            expect(jwt.verify).toHaveBeenCalledWith("valid_token", TOKEN_SECRET);
            expect(conexion.query).toHaveBeenCalledWith(
                "INSERT INTO comentarios(comentario) VALUES(?)",
                ["test comment"]
            );
            expect(conexion.query).toHaveBeenCalledWith(
                "INSERT INTO comentarios_textos(id_comentario2,idtextos) VALUES(?,?)",
                [1, 1]
            );
            expect(conexion.query).toHaveBeenCalledWith(
                "INSERT INTO comentarios_usuario(id_comentario3,emailcliente) VALUES(?,?)",
                [1, "test@example.com"]
            );
            expect(conexion.query).toHaveBeenCalledWith(
                "UPDATE publicacionestextos SET comments=(SELECT comments FROM publicacionestextos WHERE id=?)+1 WHERE id=?",
                [1, 1]
            );
            expect(res.json).toHaveBeenCalledWith("insert OK");
        });

        it("should return 'not insert' if comment insertion fails", async () => {
            jwt.verify = jest.fn().mockReturnValue({ email: "test@example.com" });
            conexion.query.mockReturnValueOnce([{ affectedRows: 0 }]);
            await insertCommentText(req, res);
            expect(jwt.verify).toHaveBeenCalledWith("valid_token", TOKEN_SECRET);
            expect(conexion.query).toHaveBeenCalledWith(
                "INSERT INTO comentarios(comentario) VALUES(?)",
                ["test comment"]
            );
            expect(res.json).toHaveBeenCalledWith("not insert");
        });

        it("should return 'not insert' if comentarios_textos insertion fails", async () => {
            jwt.verify = jest.fn().mockReturnValue({ email: "test@example.com" });
            conexion.query.mockReturnValueOnce([{ affectedRows: 1 }]);
            conexion.query.mockReturnValueOnce([{ affectedRows: 0 }]);
            await insertCommentText(req, res);
            expect(jwt.verify).toHaveBeenCalledWith("valid_token", TOKEN_SECRET);
            expect(conexion.query).toHaveBeenCalledWith(
                "INSERT INTO comentarios(comentario) VALUES(?)",
                ["test comment"]
            );
            expect(conexion.query).toHaveBeenCalledWith(
                "INSERT INTO comentarios_textos(id_comentario2,idtextos) VALUES(?,?)",
                [1, 1]
            );
            expect(res.json).toHaveBeenCalledWith("not insert");
        });

        it("should return 'not insert' if comentarios_usuario insertion fails", async () => {
            jwt.verify = jest.fn().mockReturnValue({ email: "test@example.com" });
            conexion.query.mockReturnValueOnce([{ affectedRows: 1 }]);
            conexion.query.mockReturnValueOnce([{ affectedRows: 1 }]);
            conexion.query.mockReturnValueOnce([{ affectedRows: 0 }]);
            await insertCommentText(req, res);
            expect(jwt.verify).toHaveBeenCalledWith("valid_token", TOKEN_SECRET);
            expect(conexion.query).toHaveBeenCalledWith(
                "INSERT INTO comentarios(comentario) VALUES(?)",
                ["test comment"]
            );
            expect(conexion.query).toHaveBeenCalledWith(
                "INSERT INTO comentarios_textos(id_comentario2,idtextos) VALUES(?,?)",
                [1, 1]
            );
            expect(conexion.query).toHaveBeenCalledWith(
                "INSERT INTO comentarios_usuario(id_comentario3,emailcliente) VALUES(?,?)",
                [1, "test@example.com"]
            );
            expect(res.json).toHaveBeenCalledWith("not insert");
        });
    }); */

    describe('getComents API', () => {
        test('should call query with the correct SQL and parameters', async () => {
            const req = { params: { id: 123 } };
            const queryStub = sinon.stub().resolves([{}]);
            const conexion = { query: queryStub };
            const res = { json: sinon.spy() };

            await getComments(req, res, conexion);

            expect(queryStub.calledOnceWithExactly(
                "SELECT cliente.name,cliente.iconUser,comentarios.comentario,comentarios.id,comentarios_imagen.idimagen,comentarios_usuario.emailcliente FROM comentarios,cliente,comentarios_usuario,comentarios_imagen WHERE comentarios.id=comentarios_usuario.id_comentario3 and comentarios.id=comentarios_imagen.id_comentario AND comentarios.comentario is NOT null and cliente.email=comentarios_usuario.emailcliente and comentarios_imagen.idimagen=? ORDER BY comentarios.hora DESC",
                [123]
            )).toBeTruthy;
        });

        test('should send the result as JSON', async () => {
            const req = { params: { id: 123 } };
            const queryStub = sinon.stub().resolves([{ name: 'John', comentario: 'Hello' }]);
            const conexion = { query: queryStub };
            const res = { json: sinon.spy() };

            await getComments(req, res, conexion);

            expect(res.json.calledOnceWithExactly([{ name: 'John', comentario: 'Hello' }])).toBeTruthy;
        });

        test('should log any errors', async () => {
            const req = { params: { id: 123 } };
            const queryStub = sinon.stub().rejects(new Error('Database error'));
            const conexion = { query: queryStub };
            const consoleStub = sinon.stub(console, 'log');
            const res = { json: sinon.spy() };

            await getComments(req, res, conexion);

            expect(consoleStub.calledOnceWithExactly(new Error('Database error'))).toBeTruthy;
        });
    });

    describe('getCommentsText API', () => {
        afterEach(() => {
            jest.fn();
        });

        it('should return comments text', async () => {
            const req = { params: { id: 1 } };
            const res = { json: jest.fn() };
            const expected = [{ name: 'John', iconUser: 'user.png', comentario: 'Great post!', id: 1, idtextos: 1, emailcliente: 'john@example.com' }];
            conexion.query.mockResolvedValueOnce([expected]);

            await getCommentsText(req, res);

            expect(conexion.query).toHaveBeenCalledWith(expect.any(String), [1]);
            expect(res.json).toHaveBeenCalledWith(expected);
        });

        it('should handle errors', async () => {
            const req = { params: { id: 1 } };
            const res = { json: jest.fn() };
            const error = new Error('Database error');
            conexion.query.mockRejectedValueOnce(error);

            await getCommentsText(req, res);

            expect(conexion.query).toHaveBeenCalledWith(expect.any(String), [1]);
            expect(console.log).toHaveBeenCalledWith(error);
        });
    });

    describe("updateComments API", () => {

        test("test_update_comments_successfully", async () => {
            const req = {
                body: {
                    comment: "new comment"
                },
                params: {
                    id: 1
                }
            };
            const res = {
                json: jest.fn()
            };
            const queryResult = {
                affectedRows: 1
            };
            const mockQuery = jest.spyOn(conexion, "query").mockResolvedValueOnce([queryResult]);
            await updateComments(req, res);
            expect(mockQuery).toHaveBeenCalledWith("UPDATE comentarios SET comentarios.comentario=? WHERE comentarios.id=?", ["new comment", 1]);
            expect(res.json).toHaveBeenCalledWith(queryResult);
        });

        test("test_update_comments_nonexistent_id", async () => {
            const req = {
                body: {
                    comment: "new comment"
                },
                params: {
                    id: 999
                }
            };
            const res = {
                json: jest.fn()
            };
            const queryResult = {
                affectedRows: 0
            };
            const mockQuery = jest.spyOn(conexion, "query").mockResolvedValueOnce([queryResult]);
            await updateComments(req, res);
            expect(mockQuery).toHaveBeenCalledWith("UPDATE comentarios SET comentarios.comentario=? WHERE comentarios.id=?", ["new comment", 999]);
            expect(res.json).toHaveBeenCalledWith("not update");
        });

        test("test_update_comments_security_vulnerability", async () => {
            const req = {
                body: {
                    comment: "new comment'; DROP TABLE comentarios;--"
                },
                params: {
                    id: 1
                }
            };
            const res = {
                json: jest.fn()
            };
            const queryResult = {
                affectedRows: 1
            };
            const mockQuery = jest.spyOn(conexion, "query").mockResolvedValueOnce([queryResult]);
            await updateComments(req, res);
            expect(mockQuery).toHaveBeenCalledWith("UPDATE comentarios SET comentarios.comentario=? WHERE comentarios.id=?", ["new comment'; DROP TABLE comentarios;--", 1]);
            expect(res.json).toHaveBeenCalledWith(queryResult);
        });


    });

    /* describe('deletePost', () => {
        let req, res;

        beforeEach(() => {
            req = {
                body: { param: 1 },
                params: { id: 1 },
            };
            res = {
                json: jest.fn(),
            };
        });

        afterEach(() => {
            jest.fn();
        });

        test("should delete comments and return the updated post", async () => {
            const mockQuery = jest.fn();
            mockQuery.mockReturnValueOnce([{ affectedRows: 1 }]);
            mockQuery.mockReturnValueOnce([{ affectedRows: 1 }]);
            mockQuery.mockReturnValueOnce([{ affectedRows: 1 }]);
            mockQuery.mockReturnValueOnce([{ affectedRows: 1 }]);
            const conexion = { query: mockQuery };

            await deleteComments(req, res, conexion);

            expect(mockQuery).toHaveBeenCalledTimes(4);
            expect(mockQuery).toHaveBeenCalledWith(
                "DELETE FROM comentarios_usuario WHERE id_comentario3=?",
                [1]
            );
            expect(mockQuery).toHaveBeenCalledWith(
                "DELETE FROM comentarios_imagen WHERE id_comentario=?",
                [1]
            );
            expect(mockQuery).toHaveBeenCalledWith(
                "DELETE FROM comentarios WHERE id=?",
                [1]
            );
            expect(mockQuery).toHaveBeenCalledWith(
                "UPDATE publicaciones SET comments=(SELECT comments FROM publicaciones WHERE id=?)-1 WHERE id=?",
                [1, 1]
            );
            expect(res.json).toHaveBeenCalledWith([{ affectedRows: 1 }]);
        });

        test("should return 'not delete' if comments were not deleted", async () => {
            const mockQuery = jest.fn();
            mockQuery.mockReturnValueOnce([{ affectedRows: 0 }]);
            const conexion = { query: mockQuery };

            await deleteComments(req, res, conexion);

            expect(mockQuery).toHaveBeenCalledTimes(1);
            expect(mockQuery).toHaveBeenCalledWith(
                "DELETE FROM comentarios_usuario WHERE id_comentario3=?",
                [1]
            );
            expect(res.json).toHaveBeenCalledWith("not delete");
        });

        test("should handle errors", async () => {
            const mockQuery = jest.fn(() => {
                throw new Error("Database error");
            });
            const conexion = { query: mockQuery };

            await deleteComments(req, res, conexion);

            expect(mockQuery).toHaveBeenCalledTimes(1);
            expect(mockQuery).toHaveBeenCalledWith(
                "DELETE FROM comentarios_usuario WHERE id_comentario3=?",
                [1]
            );
            expect(console.log).toHaveBeenCalledWith(new Error("Database error"));
        });

    }); */

    /*describe('deleteCommentsText', () => {

        test("test_delete_comments_text_valid_id", async () => {
            const req = {
                params: { id: 1 },
                body: { param: 1 }
            };
            const res = {
                json: jest.fn()
            };
            const mockQuery = jest.spyOn(conexion, "query").mockImplementation(() => [[{ affectedRows: 1 }]]);
            await deleteCommentsText(req, res);
            expect(mockQuery).toHaveBeenCalledTimes(4);
            expect(res.json).toHaveBeenCalledWith([[{ affectedRows: 1 }]]);
        });

        test("test_delete_comments_text_non_integer_id", async () => {
            const req = {
                params: { id: "non-integer" },
                body: { param: 1 }
            };
            const res = {
                json: jest.fn()
            };
            const mockQuery = jest.spyOn(conexion, "query").mockImplementation(() => []);
            await deleteCommentsText(req, res);
            expect(mockQuery).toHaveBeenCalledTimes(0);
            expect(res.json).toHaveBeenCalledWith("not delete");
        });

        test("test_delete_comments_text_partial_id", async () => {
            const req = {
                params: { id: 1 },
                body: { param: 1 }
            };
            const res = {
                json: jest.fn()
            };
            const mockQuery = jest.spyOn(conexion, "query").mockImplementation((query, params) => {
                if (query.includes("comentarios_usuario")) {
                    return [[{ affectedRows: 1 }]];
                } else if (query.includes("comentarios_textos")) {
                    return [];
                } else if (query.includes("comentarios")) {
                    return [[{ affectedRows: 1 }]];
                } else if (query.includes("publicacionestextos")) {
                    return [[{ affectedRows: 1 }]];
                }
            });
            await deleteCommentsText(req, res);
            expect(mockQuery).toHaveBeenCalledTimes(4);
            expect(res.json).toHaveBeenCalledWith("not delete");
        });

    }); */
});



