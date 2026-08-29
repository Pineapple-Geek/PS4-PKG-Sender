const express = require('express');
const morgan = require('morgan');
const mustache_express = require('mustache-express');
const path = require('path');
const fs = require('fs');
const { filesize } = require('filesize');
const { exec } = require('child_process');

const port = process.env.PORT;
const static_files_path = process.env.STATIC_FILES;
const ps4_ip = process.env.PS4IP;
const local_ip = process.env.LOCALIP;

const currentHost = local_ip + ":" + port;
// Construction finale pour Mustache
const finalList = [];

const app = express();

// LOGS HTTP
app.use(morgan('combined'));

// FORM DATA
app.use(express.urlencoded({ extended: true }));

// FICHIERS STATIQUES (public)
app.use(express.static(path.join(__dirname, "public")));

// MUSTACHE
app.engine('html', mustache_express());
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

// PAGE PRINCIPALE
app.get('/', async function (req, res) {
  try {
    const pkgs = await get_pkgs();
    res.render('index', { pkgs });
  } catch (err) {
    console.error(err);
    res.send("Erreur lors du chargement des PKG");
  }
});

app.get("/icons", (req, res) => {
  const dir = path.join(__dirname, "public", "icons"); // <-- CORRECT

  fs.readdir(dir, (err, files) => {
    if (err) {
      console.log("Erreur:", err);
      return res.send("Erreur lecture dossier");
    }

    const list = files
      .map(f => `<li><a href="/icons/${f}">${f}</a></li>`)
      .join("");

    res.send(`<h1>Liste des icônes</h1><ul>${list}</ul>`);
  });
});

app.get("/export-games", (req, res) => {
  // Récupère la liste des jeux depuis finalList
  const games = finalList.map(pkg => pkg.game);

  // Construit le contenu du fichier
  const content = games.join("\n");

  // Chemin du fichier à générer
  const filePath = path.join(__dirname, "games.txt");

  // Écrit le fichier
  fs.writeFile(filePath, content, (err) => {
    if (err) {
      console.log("Erreur écriture fichier:", err);
      return res.send("Erreur lors de la génération du fichier.");
    }

    // Envoie le fichier au navigateur
    res.download(filePath, "games.txt");
  });
});


// ROUTE POUR SERVIR LES PKG (propre)
app.get('/pkg/:name', (req, res) => {
  const name = req.params.name;
  const fullpath = path.join(static_files_path, name);

  if (!fs.existsSync(fullpath)) {
    return res.status(404).send("PKG introuvable");
  }

  res.sendFile(fullpath);
});

// INSTALLATION PS4
app.post('/install', function(req, res) {
  const filepath = req.body.filepath;
  const filename = path.basename(filepath);

  const pkg_uri = `http://${local_ip}:${port}/pkg/${encodeURI(filename)}`;
  const ps4_api_uri = `http://${ps4_ip}:12800/api/install`;
  const curl_command = `curl -v "${ps4_api_uri}" --data '{"type":"direct","packages":["${pkg_uri}"]}'`;

  res.write(curl_command + "\n");
  console.log(curl_command);

  exec(curl_command, (err, stdout, stderr) => {
    if (err) {
      res.write(err.toString());
      res.end();
      console.error(err);
      return;
    }
    res.write(`stdout: ${stdout}\n`);
    res.write(`stderr: ${stderr}\n`);
    res.end();
  });
});

// DÉMARRAGE SERVEUR
app.listen(port, function () {
  console.log(`PS4 PKG sender listening on port ${port} serving files from ${static_files_path}`);
});


// ------------------------------
// FONCTIONS INTERNES
// ------------------------------

async function get_pkgs() {
  const walkSync = function(dir, filelist) {
    const files = fs.readdirSync(dir);

    files.forEach(function(file) {
      const filepath = path.join(dir, file);
      const stat = fs.statSync(filepath);

      if (stat.isDirectory()) {
        filelist = walkSync(filepath, filelist);
      } else if (path.extname(file).toLowerCase() === '.pkg') {

        const parsed = parsePkgName(file);
        if (!parsed) return;

        filelist.push({
          filepath,
          game: parsed.game,
          variant: parsed.variant,
          name: file,
          size: filesize(stat.size)
        });
      }
    });

    return filelist;
  };

  const pkgs = walkSync(static_files_path, []);

  // TRI ALPHABÉTIQUE
  pkgs.sort((a, b) => a.game.localeCompare(b.game));

  // GROUPING
  const grouped = {};

  for (const pkg of pkgs) {
    if (!grouped[pkg.game]) grouped[pkg.game] = [];

    const encodedName = encodeURIComponent(pkg.game);

    const filePath = `http://${currentHost}/icons/${encodedName}.jpg`;
    console.log(filePath);

    const exists = await IconExist(filePath);

    pkg.image = exists
      ? `/icons/${pkg.game}.jpg`
      : `/placeholder.png`;

    grouped[pkg.game].push(pkg);
  }

  for (const game of Object.keys(grouped)) {
    finalList.push({
      game,
      image: grouped[game][0].image,
      files: grouped[game]
    });
  }

  return finalList;
}

async function IconExist(chemin) {
  try {
    const response = await fetch(chemin, { method: 'HEAD' });
    if (response.ok) {
      console.log('File exists!');
      return true;
    } else {
      console.log('File does not exist (404).');
      return false;
    }
  } catch (error) {
    console.error('Network error or CORS issue:', error);
    return false;
  }
}

function parsePkgName(filename) {
  const match = filename.match(/^(.*)\((.*)\)\.pkg$/);

  if (!match) return null;

  const rawName = match[1].replace(/-/g, ' ').trim();
  const variant = match[2].trim();

  return {
    game: rawName,
    variant: variant
  };
}
