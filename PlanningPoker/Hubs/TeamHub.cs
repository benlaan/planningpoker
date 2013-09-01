using System;
using System.Collections.Generic;
using System.Linq;

using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using System.Threading.Tasks;

namespace PlanningPoker.Controllers
{
    [HubName("teamHub")]
    public class TeamHub : Hub
    {
        TeamStore _storage;

        /// <summary>
        /// Initializes a new instance of the TeamHub class.
        /// </summary>
        public TeamHub() : this(TeamStore.Instance)
        {
        }

        public TeamHub(TeamStore storage)
        {
            _storage = storage;
        }

        public void NewTeam(string teamName, string playerName, int duration, bool participating)
        {
            Groups.Add(Context.ConnectionId, teamName);

            if (_storage.NewTeam(teamName, playerName, duration, participating, Context.ConnectionId))
                Clients.Client(Context.ConnectionId).TeamAdded();
            else
            {
                Clients.Client(Context.ConnectionId).Error(String.Format("A Host with the name '{0}' already exists. Please try a different name", teamName));
                Groups.Remove(Context.ConnectionId, teamName);
            }
        }

        public async void NewPlayer(string teamName, string playerName)
        {
            await Groups.Add(Context.ConnectionId, teamName);
            _storage.NewPlayer(teamName, playerName, Context.ConnectionId);
        }

        public async void NewViewer(string teamName)
        {
            await Groups.Add(Context.ConnectionId, teamName);
            _storage.NewViewer(teamName, teamName + Context.ConnectionId, Context.ConnectionId);
        }

        public void NewRound()
        {
            _storage.NewRound(Context.ConnectionId);
        }

        public void SubmitScore(string score)
        {
            _storage.SubmitScore(score, Context.ConnectionId);
        }

        public void Start()
        {
            _storage.Start(Context.ConnectionId);
        }

        public void Stop()
        {
            _storage.Stop(Context.ConnectionId);
        }

        public void Pause()
        {
            _storage.Pause(Context.ConnectionId);
        }

        public override System.Threading.Tasks.Task OnDisconnected()
        {
            _storage.RemovePlayer(Context.ConnectionId);

            return base.OnDisconnected();
        }
    }
}