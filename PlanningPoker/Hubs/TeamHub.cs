using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;

using Microsoft.AspNet.SignalR;

namespace PlanningPoker.Controllers
{
    public class Player
    {
        public string Name { get; set; }
        public int? Score { get; set; }
        public bool ViewOnly { get; set; }
    }

    public class Team
    {
        /// <summary>
        /// Initializes a new instance of the Team class.
        /// </summary>
        public Team(string name)
        {
            Name = name;
            Players = new ConcurrentDictionary<string, Player>();
        }

        private Player CreateClient(string playerName, string connectionId)
        {
            if (Players.ContainsKey(connectionId))
                throw new Exception("Player already at Team");

            Player player = new Player { Name = playerName };
            Players[connectionId] = player;

            return player;
        }

        public void Reset()
        {
            foreach (Player player in Players.Values)
                player.Score = null;
        }

        public void AddPlayer(string playerName, string connectionId)
        {
            CreateClient(playerName, connectionId);
        }

        public bool RemovePlayer(string connectionId)
        {
            Player player;
            return Players.TryRemove(connectionId, out player);
        }

        public void AddViewer(string playerName, string connectionId)
        {
            Player player = CreateClient(playerName, connectionId);
            player.ViewOnly = true;
        }

        public void SubmitCardScore(int score, string connectionId)
        {
            Players[connectionId].Score = score;
        }

        public string Name { get; set; }
        public ConcurrentDictionary<string, Player> Players { get; set; }
    }

    public class TeamHub : Hub
    {
        private ConcurrentDictionary<string, Team> _teams;

        /// <summary>
        /// Initializes a new instance of the TeamHub class.
        /// </summary>
        public TeamHub()
        {
            _teams = new ConcurrentDictionary<string, Team>();
        }

        public void Hello()
        {
            Clients.All.hello();
        }

        public void NewTeam(string teamName)
        {
            if (_teams.ContainsKey(teamName))
                throw new Exception("Team name already in use");

            _teams[teamName] = new Team(teamName);
        }

        public void NewRound(string teamName)
        {
            _teams[teamName].Reset();
            Clients.Group(teamName).newRound();
        }

        public async void NewPlayer(string teamName, string playerName)
        {
            _teams[teamName].AddPlayer(playerName, Context.ConnectionId);
            await Groups.Add(Context.ConnectionId, teamName);

            Clients.Group(teamName).newPlayer(playerName);
        }

        public async void NewViewer(string teamName, string playerName)
        {
            _teams[teamName].AddViewer(playerName, Context.ConnectionId);
            await Groups.Add(Context.ConnectionId, teamName);

            Clients.Group(teamName).newPlayer(playerName);
        }

        public void SubmitCardScore(string teamName, int score)
        {
            _teams[teamName].SubmitCardScore(score, Context.ConnectionId);
        }

        public override System.Threading.Tasks.Task OnDisconnected()
        {
            foreach (Team team in _teams.Values)
            {
                bool removed = team.RemovePlayer(Context.ConnectionId);
                if (removed)
                    break;
            }

            return base.OnDisconnected();
        }

        public override System.Threading.Tasks.Task OnConnected()
        {
            return base.OnConnected();
        }
    }
}