using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;

using Microsoft.AspNet.SignalR;

namespace PlanningPoker.Controllers
{
    public class TeamStore
    {
        // use Lazy as singleton pattern for thread safety
        private static Lazy<TeamStore> _instance = new Lazy<TeamStore>();

        private ConcurrentDictionary<string, Team> _teams;

        public TeamStore()
        {
            _teams = new ConcurrentDictionary<string, Team>();
        }

        private Team GetTeamByConnectionId(string connectionId)
        {
            return _teams.Values.SingleOrDefault(t => t.Players.Any(p => p.Key == connectionId));
        }

        public bool NewTeam(string teamName, string playerName, int duration, bool participating, string connectionId)
        {
            var hub = GlobalHost.ConnectionManager.GetHubContext<TeamHub>().Clients;

            Team team;
            string teamKeyName = teamName.ToLower();

            if (_teams.TryGetValue(teamKeyName, out team))
                return false;

            team = new Team(teamKeyName, duration, hub);

            var mode = participating ? ClientMode.ParticipatingHost : ClientMode.Host;
            team.AddClient(playerName, connectionId, mode);

            _teams[teamKeyName] = team;
            return true;
        }

        private Team GetTeamByName(string teamName)
        {
            return _teams[teamName.ToLower()];
        }

        public void NewPlayer(string teamName, string playerName, string connectionId)
        {
            GetTeamByName(teamName).AddClient(playerName, connectionId, ClientMode.Player);
        }

        public void NewViewer(string teamName, string playerName, string connectionId)
        {
            GetTeamByName(teamName).AddClient(playerName, connectionId, ClientMode.Viewer);
        }

        public void SubmitScore(string score, string connectionId)
        {
            var team = GetTeamByConnectionId(connectionId);
            if (team != null)
                team.SubmitCardScore(score, connectionId);
        }

        public void NewRound(string connectionId)
        {
            var team = GetTeamByConnectionId(connectionId);
            if (team != null)
                team.Reset();
        }

        public void RemovePlayer(string connectionId)
        {
            var team = GetTeamByConnectionId(connectionId);
            if (team == null)
                return;

            team.RemovePlayer(connectionId);

            if (!team.Players.Any())
                _teams.TryRemove(team.Name.ToLower(), out team);
        }
        
        public void Start(string connectionId)
        {
            var team = GetTeamByConnectionId(connectionId);
            if (team != null)
                team.Start();
        }

        public void Stop(string connectionId)
        {
            var team = GetTeamByConnectionId(connectionId);
            if (team != null)
                team.Stop();
        }

        public void Pause(string connectionId)
        {
            var team = GetTeamByConnectionId(connectionId);
            if (team != null)
                team.Pause();
        }

        public static TeamStore Instance
        {
            get { return _instance.Value; }
        }
    }
}
