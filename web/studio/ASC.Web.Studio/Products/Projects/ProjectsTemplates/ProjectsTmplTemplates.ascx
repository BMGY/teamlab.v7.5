﻿<%@ Control Language="C#" AutoEventWireup="false" EnableViewState="false" %>
<%@ Assembly Name="ASC.Web.Studio" %>
<%@ Assembly Name="ASC.Web.Projects" %>
<%@ Import Namespace="ASC.Web.Projects.Resources" %>

<script id="projects_templatesEditMilestoneTmpl" type="text/x-jquery-tmpl">
    <div class="milestone" id="m_${number}">
        <div class="mainInfo menuButtonContainer with-entity-menu">
            <span class="daysCount" value="${duration}"><span>${duration}</span></span>
            <span class="title">${title}</span>
            {{if tasks.length == 0}}
                <a class="addTask"> + <%=ProjectTemplatesResource.Task %></a>
            {{else}}
                <a class="addTask hide"> + <%=ProjectTemplatesResource.Task %></a>
            {{/if}}
            <span class="entity-menu"></span>
        </div>
        {{if displayTasks}}
        <div class="milestoneTasksContainer" style="display: block;">
        {{else}}
        <div class="milestoneTasksContainer">
        {{/if}}
            <div class="listTasks" milestone="m_${number}">
                {{each(i, task) tasks}}
                    <div id="${number}_${i+1}" class="task menuButtonContainer with-entity-menu">
                        <span class="title">${task.title}</span>
                        <span class="entity-menu"></span>
                    </div>
                {{/each}}
            </div>
            {{if displayTasks}}
            <div class="addTaskContainer" style="display:block;">
            {{else}}
            <div class="addTaskContainer">
            {{/if}}
                <a class="baseLinkAction"><%=ProjectResource.AddTask %></a>
            </div>
        </div>
    </div>
</script>

<script id="projects_templatesEditTaskTmpl" type="text/x-jquery-tmpl">
    <div class="task menuButtonContainer with-entity-menu" id="t_${number}">
          <span class="title">${title}</span>
          <span class="entity-menu"></span>
    </div>
</script> 





<script id="projects_templatesCreateMilestoneTmpl" type="text/x-jquery-tmpl">
    <div class="milestone" id="m_${number}">
        <div class="mainInfo menuButtonContainer with-entity-menu">
            <span class="dueDate"><span>${date}</span></span>
            <span class="title">${title}</span>
            {{if tasks.length == 0}}
                <a class="addTask"> + <%=ProjectTemplatesResource.Task %></a>
            {{else}}
                <a class="addTask hide"> + <%=ProjectTemplatesResource.Task %></a>
            {{/if}}
            <span class="entity-menu"></span>
        </div>
        {{if displayTasks}}
        <div class="milestoneTasksContainer" style="display: block;">
        {{else}}
        <div class="milestoneTasksContainer">
        {{/if}}
            <div class="listTasks" milestone="m_${number}">
                {{each(i, task) tasks}}
                    <div id="${number}_${i+1}" class="task menuButtonContainer with-entity-menu">
                        <span class="title">${task.title}</span>
                        <span class="entity-menu"></span>
                    </div>
                {{/each}}
            </div>
            {{if displayTasks}}
            <div class="addTaskContainer" style="display:block;">
            {{else}}
            <div class="addTaskContainer">
            {{/if}}
                <a class="baseLinkAction"><%=ProjectResource.AddTask %></a>
            </div>
        </div>
    </div>
</script>

<script id="projects_templatesCreateTaskTmpl" type="text/x-jquery-tmpl">
    <div class="task menuButtonContainer with-entity-menu" id="t_${number}">
          <span class="title">${title}</span>
          <span class="entity-menu"></span>
    </div>
</script> 





<script id="projects_templateTmpl" type="text/x-jquery-tmpl">
        <tr class="with-entity-menu template menuButtonContainer" id="${id}">
              <td class="stretch">
              <a href="projectTemplates.aspx?id=${id}&action=edit" class="title">${title}</a>
              <span class="description">(${milestones} <%= ProjectTemplatesResource.Milestones %>, ${tasks} <%= ProjectTemplatesResource.Tasks %>)</span>
              </td>
              <td>
                <span class="entity-menu"></span>
              </td>
        </tr>
</script> 
