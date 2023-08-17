const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;
const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server running at http://localhost:3000/`);
    });
  } catch (e) {
    console.log(`ERROR:${e.message}`);
    process.exit(1);
  }
};
initializeDBandServer();

//API 1
app.get("/players/", async (req, res) => {
  const getAllPlayersQuery = `
        SELECT 
            *
        FROM
            player_details;`;
  const players = await db.all(getAllPlayersQuery);
  res.send(
    players.map((each) => ({
      playerId: each.player_id,
      playerName: each.player_name,
    }))
  );
});
//API 2
app.get("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;
  const getPlayerQuery = `
        SELECT 
            *
        FROM 
            player_details
        WHERE player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  res.send({
    playerId: player.player_id,
    playerName: player.player_name,
  });
});

//API 3
app.put("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;
  const playerDetails = req.body;
  const { playerName } = playerDetails;
  const updateQuery = `
        UPDATE
            player_details
        SET
            player_name =' ${playerName}'
        WHERE player_id = ${playerId};`;
  await db.run(updateQuery);
  res.send(`Player Details Updated`);
});

//API 4
app.get("/matches/:matchId/", async (req, res) => {
  const { matchId } = req.params;
  const getMatchDetailsQuery = `
        SELECT 
            *
        FROM 
            match_details
        WHERE match_id = ${matchId};`;
  const matchDetails = await db.get(getMatchDetailsQuery);
  res.send({
    matchId: matchDetails.match_id,
    match: matchDetails.match,
    year: matchDetails.year,
  });
});

//API 5
app.get("/players/:playerId/matches", async (req, res) => {
  const { playerId } = req.params;
  const playerMatchesQuery = `
        SELECT 
            *
        FROM player_match_score
        NATURAL JOIN match_details
        WHERE player_id = ${playerId};`;
  const playerMatchDetails = await db.all(playerMatchesQuery);
  console.log(playerMatchDetails);
  res.send(
    playerMatchDetails.map((each) => ({
      matchId: each.match_id,
      match: each.match,
      year: each.year,
    }))
  );
});

//API 6
app.get("/matches/:matchId/players", async (req, res) => {
  const { matchId } = req.params;
  const getMatchPlayersQuery = `
	    SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
  const playerMatch = await db.all(getMatchPlayersQuery);
  res.send(playerMatch);
});

//API 7
app.get("/players/:playerId/playerScores", async (req, res) => {
  const { playerId } = req.params;
  const getPlayerScored = `
        SELECT
            player_details.player_id AS playerId,
            player_details.player_name AS playerName,
            SUM(player_match_score.score) AS totalScore,
            SUM(fours) AS totalFours,
            SUM(sixes) AS totalSixes FROM 
            player_details INNER JOIN player_match_score ON
            player_details.player_id = player_match_score.player_id
            WHERE player_details.player_id = ${playerId};`;

  const playerScores = await db.get(getPlayerScored);
  res.send(playerScores);
});

module.exports = app;
