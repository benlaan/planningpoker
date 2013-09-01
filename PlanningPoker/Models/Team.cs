using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Timers;

using Microsoft.AspNet.SignalR.Hubs;

namespace PlanningPoker.Controllers
{
    public enum ClientMode
    {
        Player,
        Host,
        Viewer,
        ParticipatingHost
    }

    public class Player
    {
        /// <summary>
        /// Initializes a new instance of the Player class.
        /// </summary>
        public Player()
        {
            Name = String.Empty;
            Score = "?";
            Mode = ClientMode.Player;
        }

        public string Name { get; set; }
        public string Score { get; set; }
        public ClientMode Mode { get; set; }
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
        private readonly string[] _scores = new[] { "?", "0", "½", "1", "2", "3", "5", "8", "13", "20", "40", "100", "∞" };

        private TeamState _state;
        private readonly Timer _timer;
        private readonly IHubConnectionContext _sendTo;
        private int _timeRemaining;

        /// <summary>
        /// Initializes a new instance of the Team class.
        /// </summary>
        public Team(string name, int duration, IHubConnectionContext hubConnectionContext)
        {
            _sendTo = hubConnectionContext;

            Duration = duration;
            _timeRemaining = duration;
            Name = name;
            Players = new ConcurrentDictionary<string, Player>();

            _timer = new Timer(1000);
            _timer.Elapsed += TimerElapsed;
        }

        private void TimerElapsed(object sender, ElapsedEventArgs e)
        {
            if (State == TeamState.Started && DateTime.UtcNow >= EndTime)
                Stop();
        }

        private void NotifyScoreForPlayer(Player player)
        {
            _sendTo.Group(Name).UpdateScore(player.Name, player.Score);
        }

        private void NotifyNewConnectionOfPlayers(string connectionId)
        {
            var otherPlayers = Players
                .Values
                .Where(p => p.Mode == ClientMode.Player || p.Mode == ClientMode.ParticipatingHost)
                .ToList();

            foreach (Player otherPlayer in otherPlayers)
            {
                _sendTo
                    .Client(connectionId)
                    .AddPlayer(otherPlayer.Name, otherPlayer.Score);
            }
        }

        private void NotifyViewersOfNewPlayer(string connectionId, Player player)
        {
            _sendTo.Client(connectionId).Joined(_scores);

            var nonPlayerConnectionIds = Players
                .Where(p => p.Value.Mode == ClientMode.Player)
                .Select(p => p.Key)
                .ToArray();

            _sendTo
                .Group(Name, nonPlayerConnectionIds)
                .AddPlayer(player.Name, player.Score);
        }

        public Player AddClient(string playerName, string connectionId, ClientMode mode)
        {
            Player player;
            if (Players.TryGetValue(connectionId, out player))
            {
                _sendTo.Client(connectionId).Error(
                    String.Format("Player {0} already within Team", playerName)
                );
                return player;
            }

            player = new Player { Name = playerName, Mode = mode };
            Players[connectionId] = player;

            switch (mode)
            {
                case ClientMode.Player:
                case ClientMode.ParticipatingHost:
                    NotifyViewersOfNewPlayer(connectionId, player);
                    break;

                case ClientMode.Viewer:
                    NotifyNewConnectionOfPlayers(connectionId);
                    break;
            }

            return player;
        }

        public void Reset()
        {
            State = TeamState.Initialised;
            _timeRemaining = Duration;
            _sendTo.Group(Name).Reset();

            foreach (Player player in Players.Values)
            {
                player.Score = "?";
                NotifyScoreForPlayer(player);
            }
        }

        public bool RemovePlayer(string connectionId)
        {
            Player player;
            bool removed = Players.TryRemove(connectionId, out player);
            if (removed)
                _sendTo.Group(Name).RemovePlayer(player.Name);

            return removed;
        }

        public void SubmitCardScore(string score, string connectionId)
        {
            if (_scores.All(s => s != score))
                return;

            Player player = Players[connectionId];
            player.Score = score;
            NotifyScoreForPlayer(player);
        }

        public void Start()
        {
            State = TeamState.Started;
            CurrentTime = DateTime.UtcNow;
            EndTime = CurrentTime.Add(new TimeSpan(0, 0, Duration));
            _sendTo.Group(Name).Started(EndTime);
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

            _sendTo.Group(Name).Stopped();
        }

        public void Pause()
        {
            // Toggle Pause
            if (State == TeamState.Paused)
            {
                CurrentTime = DateTime.UtcNow;
                EndTime = CurrentTime.Add(new TimeSpan(0, 0, _timeRemaining));
                State = TeamState.Started;
            }
            else
            {
                _timeRemaining = (int)EndTime.Subtract(DateTime.UtcNow).TotalSeconds;
                State = TeamState.Paused;
            }

            _sendTo.Group(Name).Paused(EndTime, _timeRemaining);
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
        public DateTime CurrentTime { get; set; }
        public string Name { get; set; }

        /// <summary>
        /// Player collection, keyed by SignalR ConnectionId
        /// </summary>
        public ConcurrentDictionary<string, Player> Players { get; set; }
    }
}
