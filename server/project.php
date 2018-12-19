<?php
  require_once('db.php');

  class PROJECT {

    public function get_all_items() {
      global $db; 
      $query = "SELECT * FROM todo ORDER BY priority DESC ";
      $results = $db->select($query);
      while ($row = $results->fetch_assoc()) { $todos[] = $row; }

      $query = "SELECT project_id, title, description, progress, deadline  FROM projects ORDER BY project_id ASC ";
      $results = $db->select($query);
      while ($row = $results->fetch_assoc()) { $projects[] = $row; }

      $all = array($todos, $projects);
      return json_encode($all);      
    }

    public function insert_project($projectstring) {
      global $db;
      $project = json_decode($projectstring);
      $title = $db->clean($project->title);
      $description = $db->clean($project->description);
      $deadline = $db->clean($project->deadline);
      $progress = $db->clean($project->progress);
      $status = $db->clean($project->status);

      $table = 'projects';
      $fields = array('project_id', 'title', 'description', 'deadline', 'progress', 'status');
      $values = array(0, "'$title'", "'$description'", "'$deadline'", "'$progress'", "'$status'");

      if ($db->insert($table, $fields, $values)) {
        $query = "SELECT * FROM projects ORDER BY project_id DESC";
        $results = $db->select($query);

        while ($row = $results->fetch_assoc()) { $projects[] = $row; }
        return json_encode($projects);
      }
      else return false;    
    }

    public function delete_project($id) {
      global $db; 
      $query = "DELETE FROM projects WHERE project_id='$id'";
      $result = $db->select($query);
      if ($result) {
        $query = "DELETE FROM project_activities WHERE project_id = $id";
        $result = $db->select($query);

        if ($result) {
          $query = "SELECT * FROM projects ORDER BY project_id DESC";
          $results = $db->select($query);

          while ($row = $results->fetch_assoc()) { $projects[] = $row; }
          return json_encode($projects);
        }
        else return false;    
      }
    }

    public function edit_project($projectstring) {
      global $db;
      $project = json_decode($projectstring);
      $title = $db->clean($project->title);
      $description = $db->clean($project->description);
      $deadline = $db->clean($project->deadline);
      $id = $project->id;

      $query = "UPDATE projects SET title = '$title', description = '$description', deadline = '$deadline' WHERE project_id = $id";

      if ($db->update($query)) {
        $query = "SELECT * FROM projects WHERE project_id='$id'";
        $result = $db->select($query);

        if ($result->num_rows == 1) { 
          $row = $result->fetch_assoc(); 
          return json_encode($row);
        }
      }
      else return false;    
    }

    public function get_project($id) {
      global $db; 
      $query = "SELECT * FROM projects WHERE project_id = $id ";
      $result = $db->select($query);
      if ($result->num_rows == 1) {
        $project = $result->fetch_assoc();
        $project['activities'] = array();

        $query = "SELECT * FROM project_activities WHERE project_id = $id ORDER BY priority DESC";
        $results = $db->select($query);
        while ($row = $results->fetch_assoc()) { $project['activities'][] = $row; }
      }
      return json_encode($project);      
    }



    public function insert_activity($activitystring) {
      global $db;
      $activity = json_decode($activitystring);
      $title = $db->clean($activity->title);
      $priority = $activity->priority;
      $status = $db->clean($activity->status);
      $id = $activity->id;

      $table = 'project_activities';
      $fields = array('activity_id', 'title', 'priority', 'status', 'project_id');
      $values = array(0, "'$title'", "'$priority'", "'$status'", "'$id'");

      //if item was added successfully, query the db for the newly added item
      if ($db->insert($table, $fields, $values)) {
        $query = "SELECT * FROM project_activities WHERE project_id = $id ORDER BY activity_id DESC";
        $results = $db->select($query);

        while ($row = $results->fetch_assoc()) { $activities[] = $row; }
        return json_encode($activities);
      }
      else return false;    
    }

    public function delete_activity($id, $project_id) {
      global $db; 
      $query = "DELETE FROM project_activities WHERE activity_id = '$id'";
      $result = $db->select($query);

      if ($result) {
        $query = "SELECT * FROM project_activities WHERE project_id = $project_id ORDER BY activity_id DESC";
        $results = $db->select($query);

        while ($row = $results->fetch_assoc()) { $activities[] = $row; }
        return json_encode($activities);
      }
    }

    public function check_activity($id, $project_id) {
      global $db; 
      $query = "UPDATE project_activities SET status = 'completed' WHERE activity_id = $id";
      $result = $db->select($query);

      //if item was added successfully, query the db for the newly added item
      if ($result) {
        $query = "SELECT * FROM project_activities WHERE project_id = $project_id ORDER BY activity_id DESC";
        $results = $db->select($query);

        while ($row = $results->fetch_assoc()) { $activities[] = $row; }
        return json_encode($activities);
      }
    }

    public function update_progress($project_id, $progress) {
      global $db; 
      $query = "UPDATE projects SET progress = '$progress' WHERE project_id = $project_id";
      $result = $db->select($query); 

      if ($result) return true;
      else return false;    
    }



    public function insert_todo($todostring) {
      global $db;
      $todo = json_decode($todostring);
      $title = $db->clean($todo->title);
      $priority = $todo->priority;
      $status = $db->clean($todo->status);

      $table = 'todo';
      $fields = array('todo_id', 'title', 'priority', 'status');
      $values = array(0, "'$title'", "'$priority'", "'$status'");

      //if item was added successfully, query the db for the newly added item
      if ($db->insert($table, $fields, $values)) {
        $query = "SELECT * FROM todo ORDER BY todo_id DESC LIMIT 0, 1";
        $results = $db->select($query);

        if ($results->num_rows == 1) { 
          $row = $results->fetch_assoc(); 
          return json_encode($row);
        }
      }
      else return false;    
    }

    public function delete_todo($id) {
      global $db; 
      $query = "DELETE FROM todo WHERE todo_id='$id'";
      $result = $db->select($query);
      if ($result) return true;
      else return false;
    }

    public function edit_todo($todostring) {
      global $db;
      $todo = json_decode($todostring);
      $title = $db->clean($todo->title);
      $priority = $todo->priority;
      $status = $db->clean($todo->status);
      $id = $todo->id;

      $query = "UPDATE todo SET title = '$title', priority = '$priority', status = '$status' WHERE todo_id = $id";

      if ($db->update($query)) {
        $query = "SELECT * FROM todo WHERE todo_id='$id'";
        $result = $db->select($query);

        if ($result->num_rows == 1) { 
          $row = $result->fetch_assoc(); 
          return json_encode($row);
        }
      }
      else return false;    
    }

    public function check_todo($id) {
      global $db; 
      $query = "UPDATE todo SET status = 'completed' WHERE todo_id=$id";
      $result = $db->select($query);
      if ($result) return true;
      else return false;
    }

  }

  $project = new PROJECT;

?>