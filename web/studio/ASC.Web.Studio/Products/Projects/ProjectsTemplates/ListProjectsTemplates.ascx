﻿<%@ Control Language="C#" AutoEventWireup="false" EnableViewState="false" %>
<%@ Assembly Name="ASC.Web.Studio" %>
<%@ Assembly Name="ASC.Web.Projects" %>
<%@ Import Namespace="ASC.Web.Projects.Configuration" %>
<%@ Import Namespace="ASC.Web.Projects.Resources" %>
<%@ Import Namespace="ASC.Web.Core.Utility.Skins" %>

<script id="projects_projectTmpl" type="text/x-jquery-tmpl">
         {{if status != 'open'}}
            <tr class="noActiveProj" id = "${id}">
         {{else}}
            <tr id = "${id}">
         {{/if}}
                <td class="action">
                    <div id = "statusContainer_${id}" class="statusContainer">
                      {{if canEdit && !isSimpleView && !Teamlab.profile.isVisitor}}
                        <span id="statusCombobox_${id}" class="canEdit">
                      {{else}}
                        <span class="noEdit" id="statusCombobox_${id}">
                      {{/if}}
                            {{if status == 'closed'}}
                                <span class="${status}" title="<%=ProjectResource.ClosedProject%>"></span>
                            {{else}}
                                {{if status == 'open'}}
                                    <span class="${status}" title="<%=ProjectResource.ActiveProject%>"></span>
                                {{else}}
                                    <span class="${status}" title="<%=ProjectResource.PausedProject%>"></span>
                                {{/if}}
                            {{/if}}
                            {{if canEdit && !isSimpleView && !Teamlab.profile.isVisitor}}
                            <span class="arrow"></span>
                            {{/if}}
                        </span>
                    </div>
                </td>
                <td class="nameProject stretch">
                    {{if privateProj}}
                        <span title="<%=ProjectResource.HiddenProject %>" class="private"></span>
                    {{/if}}
                    <a href="${projLink}" createdby="${createdBy}" created="${created}" projectid="${id}">${title}</a>
                    <span class="description">${description}</span>
                </td>
                <td class="taskCount">
                    {{if tasks != 0}}
                        <a href="${linkTasks}" title="<%=ProjectResource.TitleProjectOpenTasks%>">${tasks}</a>
                    {{/if}}
                </td>
                <td class="responsible">
                    <span id = "${responsibleId}" class='userLink{{if responsibleId=='4a515a15-d4d6-4b8e-828e-e0586f18f3a3'}} not-action{{/if}}' title="{{if !isSimpleView}}<%=ProjectResource.TitleProjectManager%>{{/if}}">${responsible}</span>
                    {{if participants != 0}}
                        <a class="participants" title="<%=ProjectResource.TitleProjectTeam%>" href="${linkParticip}">+${participants}</a>
                    {{/if}}
                </td>
                {{if isSimpleView}}
                    <td class="trash">
                        {{if canEdit || canLinkContact}}
                            <img src="<%=WebImageSupplier.GetAbsoluteWebPath("unlink_with_icon.png")%>"
                               title="<%= ProjectsCommonResource.UnlinkProjects %>" class="trash_delete" />
                            <img src="<%=WebImageSupplier.GetAbsoluteWebPath("loader16.gif", ProductEntryPoint.ID)%>"
                               title="" class="display-none trash_progress" />
                        {{/if}}
                    </td>
                {{/if}}
            </tr>
</script>


<script id="projects_projectDescribePanelTmpl" type="text/x-jquery-tmpl">
 <div id="projectDescrPanel" class="studio-action-panel" objid="">
	<div class="corner-top left"></div>
   <div class="created">
	<div class="param"><%= TaskResource.CreatingDate%>:</div>
    <div class="value">${date}</div>
  </div>
  <div class="descr">  
     <div class="param"><%= TaskResource.Description%>:</div>
     <div class="value">
        <div class="descrValue">${describe}</div>
        <a class="readMore"><%=ProjectsCommonResource.ReadMore %></a>
     </div>
  </div>
</div>
</script>