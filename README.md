
# ✨ ferdiu AI Solutions Mirror

_Mirror_ is a simple server that provides the possibility to mirror any device screen to another. Simply connect both devices to the same network the server is running and navigate to the server's IP address in your browser (remember to use the correct port). Anyone of the connected device can now start sharing its screen and the other connected device(s) will be able to see the screen.

## 🛠️ Features

- 🔄 Mirror any device screen to another
- 📺 Supports multiple devices
- 🏡 Everything is local
- ✅ No registration required
- 🔒 Privacy focused

## ⚙️ Installation

### 🐳 Docker

You can build your own docker image with the following command:

```bash
docker build -t ferdiu/ferdiu-ai-solutions-mirror .
```

and then run it with:

```bash
docker run -p 8080:3000 ferdiu/ferdiu-ai-solutions-mirror
```

### ✍️ Manual

Instantiate the server with:

```bash
npm install
```

build it:

```bash
npm run build
```

and run it:

```bash
npm start
```

## 🔧 Development

To run the server in development mode, run:

```bash
npm run dev
```

this will run the server in development mode and will automatically reload the server when you change any of the source files.

## 📃 License

See [LICENSE](LICENSE) for more information.

## 📢 Contributing

Any contributions are welcome. Please open an issue or a pull request.

## 🗒 TODOs

- [ ] make the client more smart by not just reloading the page after closing the screen sharing
- [ ] add support for the "stop sharing" button provided by the browser
- [ ] add light mode
- [ ] add a beautiful background (see [ferdiu.it](https://ferdiu.it))
