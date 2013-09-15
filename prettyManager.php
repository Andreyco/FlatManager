<?php

class PrettyManager
{
	/**
	 * Path to browse
	 *
	 * @var string
	 */
	private $givenPath;

	private $absPath;

	/**
	 * Public base URL. This URL should be
	 * accessible over HTTP protocol
	 *
	 * @var string
	 */
	private $publicBaseUrl = 'http://localhost:8888/simplemanager/';

	/**
	 * Read given path
	 */
	public function readPath($path)
	{
		$this->givenPath = str_replace('//', '/', $path);
		$this->absPath = str_replace('//', '/', getcwd().'/'.$this->givenPath);

		if (is_file($this->absPath)) {
			// Load file info
			$data = array(
				'isFile' => true,
				'path' => $this->givenPath,
				'info' => $this->getFileInfo(),
			);
		} else {
			// Read directory content
			$data = array(
				'isFile' => false,
				'content' => $this->getDirContent(),
			);
		}

		$this->returnContent($data);
	}

	public function uploadFile($uploadedFile, $uploadPath)
	{
		$targetFilename = str_replace('//', '/', getcwd().'/'.$uploadPath.'/'.$uploadedFile['name']);
		$itt = 0;
		while(file_exists($targetFilename)) {
			$itt++;
			print_r($uploadedFile);
			$name = explode('.', $uploadedFile['name']);
			$name[0] = "{$name[0]}-{$itt}";
			$targetFilename = str_replace('//', '/', getcwd().'/'.$uploadPath.'/'.implode('.', $name));
			print_r($targetFilename);
		}

		return move_uploaded_file($uploadedFile['tmp_name'], $targetFilename);
	}

	private function returnContent($content)
	{
		echo json_encode($content);
	}

	private function getFileInfo()
	{
		$stat = stat($this->absPath);

		$pathInfo = pathinfo($this->absPath);

		$return = array(
			'atime' => $stat['atime'],
			'mtime' => $stat['mtime'],
			'ctime' => $stat['ctime'],
			'size' => $stat['size'],
			'mime' => mime_content_type($this->absPath),
			'publicUrl' => $this->getPublicUrl($this->givenPath),
		);

		return array_merge($return, $pathInfo);
	}

	private function getDirContent()
	{
		$content = array();

		if ($handle = opendir($this->absPath)) {
		    while (false !== ($item = readdir($handle))) {
		        if ($item != "." && $item != "..") {
		        	array_push($content,  array(
		        		'name' => $item,
		        		'path' => str_replace('//', '/', $this->givenPath.'/'.$item),
		        		'publicUrl' => is_file($this->absPath.'/'.$item) ? $this->getPublicUrl($item) : false,
	        		));
		        }
		    }
		    closedir($handle);
		}

		return $content;
	}

	private function getPublicUrl($path)
	{
		return $this->publicBaseUrl.ltrim($path, '/');
	}


}
$pm = new PrettyManager;

if (strtolower($_SERVER['REQUEST_METHOD']) === 'get') {
	$pm->readPath(isset($_GET['path']) ? $_GET['path'] : '/');
} else {
	foreach($_FILES as $file) {
		echo json_encode( $pm->uploadFile($file, $_POST['uploadPath']) );
	}
}
