# Backdrop Assessment

### Description

#### Quick summary:

An app to demonstrate my understanding of System design in a [real world scenario](./instructions.md).

### How to Setup?

To run this application, you'll need

- [Git](https://git-scm.com)
- [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer.
- [MySQL](https://www.mysql.com/)

* Clone the repository using this command(in your Command Line)

```bash
git clone https://github.com/Comurule/demo-credit.git
```

- Go into the repository

```bash
cd demo-credit
```

- Configure the environment variables(load the variables to the terminal) using the keys in the **.env.sample** file and provide the necessary details. ( You can also change the default values of the system configurations in `src/config/constants.ts`).

- start up the application with

(For Production)

```bash
npm install --omit=dev && npm run build && npm start
```

(For Development)

```bash
npm install && npm run dev
```

- Check the port on the specified port on the env or 8000.

- For **tests**, you can run the test scripts with

```bash
npm run test
```

NB: Ensure to pass in the `savedBankDetails`, in `src/config/test.variables.ts`, with the correct values for the tests to run successfully.

### API Documentation

This can be gotten [here](https://documenter.getpostman.com/view/11194465/2s93kz75tz).

### Recommended Improvements

- In order to keep the system simple, some infrastructure was not introduced, such as cache and job queues. There are areas in the application that can utilise these infrastructure to optimize for request latency.

- Some more tests can be added.

- A notification service will be necessary to notify the user whenever the deposit and withrawal requests are settled.

### Author

Chibuike Umechukwu
