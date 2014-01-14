/* 
 * 
 * (c) Copyright Ascensio System Limited 2010-2014
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 * 
 * http://www.gnu.org/licenses/agpl.html 
 * 
 */

/***********************************************************************************************
 * File Name:       ASC.Mail.TaskKilller.Service.cs
 * Description:     This file contains class of ASC.Mail.TaskKilller.Service
 * Author:          Alexey.Safronov
 * Creation date:   4/1/2011 11:22:56 AM
 ***********************************************************************************************/

using System;
using System.Globalization;
using System.ServiceProcess;
using System.Threading;
using NLog;
using ASC.Mail.Aggregator;
using System.Configuration;

namespace ASC.Mail.Watchdog.Service
{
    partial class Watchdog : ServiceBase
    {
        #region - Declaration -

        private readonly ManualResetEvent mreStop = new ManualResetEvent(false);
        private readonly Logger _log = LogManager.GetLogger("Watchdog");
        private readonly MailBoxManager _manger = new MailBoxManager(ConfigurationManager.ConnectionStrings["mail"], 25);
        Thread _thread;
        private readonly int WAIT_TIME_IN_MINUTES = Convert.ToInt32(ConfigurationManager.AppSettings["old_tasks_timeout_in_minutes"]);
        #endregion

        #region - Constructor -
        public Watchdog()
        {
            InitializeComponent();
            CanStop = true;
            AutoLog = true;
        }
        #endregion

        #region - Start / Stop -
        public void StartConsole()
        {
            OnStart(null);
            Console.CancelKeyPress += delegate {
                    OnStop();
                };
        }

        protected override void OnStart(string[] args)
        {
#if DEBUG
            System.Diagnostics.Debugger.Launch();
#endif
            try
            {
                //Start service
                mreStop.Reset();

                ThreadStart pts = MainThread;

                // Setup thread.
                _thread = new Thread(pts);
                // Start it.
                _thread.Start();
            }
            catch (Exception)
            {
                OnStop();
            }
        }

        protected override void OnStop()
        {
            //Service will be stoped in future 30 seconds!
            // signal to tell the worker process to stop
            mreStop.Set();
            _log.Info("Administrator stopped the service");
            // give it a little time to finish any pending work
            if (_thread == null) return;
            _thread.Join(new TimeSpan(0, 0, 30));
            _thread.Abort();
        }
        #endregion

        #region - Threads -
        void MainThread()
        {
            try
            {
                _log.Info("Start service");

                _log.Debug("The service will kill old aggregator's tasks in every {0} minutes", WAIT_TIME_IN_MINUTES);

                var wait_time = TimeSpan.FromMinutes(WAIT_TIME_IN_MINUTES);

                while (true)
                {
                    try
                    {
                        var killed_mailbox_ids = _manger.KillOldTasks(WAIT_TIME_IN_MINUTES);

                        if (killed_mailbox_ids.Count > 0)
                        {
                            var mail_boxes = "";

                            killed_mailbox_ids.ForEach(i => mail_boxes += i.ToString(CultureInfo.InvariantCulture) + "|");

                            mail_boxes = mail_boxes.Remove(mail_boxes.Length - 1, 1);

                            _log.Info("Killed next old task's ids: {0}", mail_boxes);
                        }
                        else
                        {
                            _log.Info("Nothing to do!");
                        }
                    }
                    catch (Exception ex)
                    {
                        _log.Fatal("Unable to kill tasks. Exception:\r\n{0}", ex.ToString());
                    }

                    _log.Debug("Waiting for {0} minutes for next check...", WAIT_TIME_IN_MINUTES);

                    if (mreStop.WaitOne(wait_time))
                    {
                        break;
                    }
                }
            }
            catch (Exception) { }
            finally
            {
                OnStop();
            }
        }
        #endregion
    }
}
