using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Timers;

using Microsoft.AspNet.SignalR.Hubs;

namespace PlanningPoker.Controllers
{
    public class Player
    {
        public string Name { get; set; }
        public string Score { get; set; }
        public bool ViewOnly { get; set; }
    }

    public enum TeamState
    {
        Initialised,
        Started,
        Paused,
        Stopped
    }

    public class Team
    {
        private string[] _scores = new[] { "?", "0", "½", "1", "2", "3", "5", "8", "13", "20", "40", "100", "∞" };

        private TeamState _state;
        private Timer _timer;
        private readonly IHubConnectionContext _hubConnectionContext;
        private int _timeRemaining;
        
        /// <summary>
        /// Initializes a new instance of the Team class.
        /// </summary>
        public Team(string name, int duration, IHubConnectionContext hubConnectionContext)
        {
            _hubConnectionContext = hubConnectionContext;
            
            Duration = duration;
            _timeRemaining = duration;
            Name = name;
            Players = new ConcurrentDictionary<string, Player>();

            _timer = new Timer(1000);
            _timer.Elapsed += TimerElapsed;
        }

        private void TimerElapsed(object sender, ElapsedEventArgs e)
        {
            if (State == TeamState.Started && DateTime.Now >= EndTime)
                Stop();
        }

        private Player AddClient(string playerName, string connectionId, bool viewOnly)
        {
            if (Players.ContainsKey(connectionId))
                throw new Exception("Player already at Team");

            Player player = new Player { Name = playerName, ViewOnly = viewOnly };
            Players[connectionId] = player;

            if (!viewOnly)
                _hubConnectionContext.Group(Name).AddPlayer(player.Name);

            return player;
        }

        private void NotifyScoreForPlayer(Player player)
        {
            _hubConnectionContext.Group(Name).UpdateScore(player.Name, player.Score);
        }

        public void Reset()
        {
            State = TeamState.Initialised;
            _timeRemaining = Duration;
            _hubConnectionContext.Group(Name).Reset();

            foreach (Player player in Players.Values)
            {
                player.Score = null;
                NotifyScoreForPlayer(player);
            }
        }

        public void AddPlayer(string playerName, string connectionId)
        {
            AddClient(playerName, connectionId, false);
        }

        public bool RemovePlayer(string connectionId)
        {
            Player player;
            bool removed = Players.TryRemove(connectionId, out player);
            if (removed)
                _hubConnectionContext.Group(Name).RemovePlayer(player.Name);

            return removed;
        }

        public void AddViewer(string playerName, string connectionId)
        {
            Player player = AddClient(playerName, connectionId, true);
        }

        public void SubmitCardScore(string score, string connectionId)
        {
            if (!_scores.Any(s => s == score))
                return;

            Player player = Players[connectionId];
            player.Score = score;
            NotifyScoreForPlayer(player);
        }

        public void Start()
        {
            State = TeamState.Started;
            EndTime = DateTime.Now.Add(new TimeSpan(0, 0, Duration));
            _hubConnectionContext.Group(Name).Started(EndTime);
        }

        public void Stop()
        {
            State = TeamState.Stopped;

            var pendingScorers = Players.Values.Where(p => p.Score == null).ToList();
            foreach (var player in pendingScorers)
            {
                player.Score = _scores[0];
                NotifyScoreForPlayer(player);
            }

            _hubConnectionContext.Group(Name).Stopped();
        }

        public void Pause()
        {
            // Toggle Pause
            if (State == TeamState.Paused)
            {
                EndTime = DateTime.Now.Add(new TimeSpan(0, 0, _timeRemaining));
                State = TeamState.Started;
            }
            else
            {
                _timeRemaining = (int)EndTime.Subtract(DateTime.Now).TotalSeconds;
                State = TeamState.Paused;
            }

            _hubConnectionContext.Group(Name).Paused(EndTime, _timeRemaining);
        }

        public TeamState State
        {
            get { return _state; }
            set
            {
                _state = value;
                _timer.Enabled = State == TeamState.Started;
            }
        }

        public int Duration { get; set; }
        public DateTime EndTime { get; set; }
        public string Name { get; set; }

        /// <summary>
        /// Player collection, keyed by SignalR ConnectionId
        /// </summary>
        public ConcurrentDictionary<string, Player> Players { get; set; }
    }
}
